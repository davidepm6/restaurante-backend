import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Categoria, Producto } from '../../api/catalogo'
import { filtrarProductos } from '../../lib/busqueda'
import { formatoMoneda } from '../../lib/format'
import { estadoStock } from '../../lib/stock'
import { Select } from '../ui/Select'
import styles from './BuscadorProductos.module.css'

interface BuscadorProductosProps {
    productos: Producto[]
    categorias: Categoria[]
    cantidadEnPedido: (productoId: number) => number
    onElegir: (producto: Producto) => void
    /** Cada vez que este número cambia, el buscador recupera el foco. */
    senalEnfocar?: number
    }

    export function BuscadorProductos({
    productos,
    categorias,
    cantidadEnPedido,
    onElegir,
    senalEnfocar = 0,
    }: BuscadorProductosProps) {
    const [termino, setTermino] = useState('')
    const [categoriaId, setCategoriaId] = useState('')
    const [activo, setActivo] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const idBase = useId()

    const resultados = filtrarProductos(productos, termino, categoriaId === '' ? null : Number(categoriaId))
    const indiceActivo = Math.min(activo, Math.max(resultados.length - 1, 0))

    useEffect(() => {
        inputRef.current?.focus()
    }, [senalEnfocar])

    useEffect(() => {
        document.getElementById(`${idBase}-op-${indiceActivo}`)?.scrollIntoView?.({ block: 'nearest' })
    }, [idBase, indiceActivo])

    function elegir(producto: Producto) {
        onElegir(producto)
        setTermino('')
        setActivo(0)
        inputRef.current?.focus()
    }

    function alPulsar(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActivo(Math.min(indiceActivo + 1, resultados.length - 1))
        } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActivo(Math.max(indiceActivo - 1, 0))
        } else if (e.key === 'Enter') {
        e.preventDefault()
        const elegido = resultados[indiceActivo]
        if (elegido) elegir(elegido)
        } else if (e.key === 'Escape' && termino !== '') {
        e.preventDefault()
        setTermino('')
        setActivo(0)
        }
    }

    return (
        <section className={styles.buscador} aria-label="Buscar productos">
        <div className={styles.controles}>
            <div className={styles.campoBusqueda}>
            <label htmlFor={`${idBase}-buscar`} className={styles.etiqueta}>
                Buscar producto
            </label>
            <input
                id={`${idBase}-buscar`}
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={resultados.length > 0}
                aria-controls={`${idBase}-lista`}
                aria-activedescendant={resultados.length > 0 ? `${idBase}-op-${indiceActivo}` : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="Escribe para buscar y pulsa Enter para agregar"
                className={styles.entrada}
                value={termino}
                onChange={(e) => {
                setTermino(e.target.value)
                setActivo(0)
                }}
                onKeyDown={alPulsar}
            />
            </div>
            <Select
            etiqueta="Categoría"
            value={categoriaId}
            onChange={(e) => {
                setCategoriaId(e.target.value)
                setActivo(0)
            }}
            >
            <option value="">Todas</option>
            {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                {c.nombre}
                </option>
            ))}
            </Select>
        </div>

        <ul id={`${idBase}-lista`} role="listbox" aria-label="Resultados" className={styles.lista}>
            {resultados.map((p, i) => {
            const enPedido = cantidadEnPedido(p.id)
            const estado = estadoStock(p)
            const agotado = estado === 'AGOTADO'
            const clases = [
                styles.opcion,
                i === indiceActivo ? styles.activa : '',
                agotado ? styles.agotada : '',
                estado === 'BAJO' ? styles.bajo : '',
            ]
                .filter(Boolean)
                .join(' ')
            return (
                <li
                key={p.id}
                id={`${idBase}-op-${i}`}
                role="option"
                aria-selected={i === indiceActivo}
                aria-disabled={agotado || undefined}
                className={clases}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(p)}
                >
                <span className={styles.nombre}>{p.nombre}</span>
                <span className={styles.meta}>
                    {formatoMoneda(p.precio)} · {agotado ? 'Agotado' : `stock ${p.stock}`}
                    {estado === 'BAJO' ? ' · stock bajo' : ''}
                    {enPedido > 0 ? ` · en pedido: ${enPedido}` : ''}
                </span>
                </li>
            )
            })}
        </ul>

        {resultados.length === 0 && (
            <p role="status" className={styles.vacio}>
            {termino ? `Sin resultados para «${termino}».` : 'No hay productos para mostrar.'}
            </p>
        )}
        </section>
    )
}