import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import {
    useActualizarCategoria,
    useCategorias,
    useCrearCategoria,
    useEliminarCategoria,
    type Categoria,
} from '../api/catalogo'
import { ApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { DataTable, type Columna } from '../components/ui/DataTable'
import { Dialog } from '../components/ui/Dialog'
import { Field } from '../components/ui/Field'
import { Paginador } from '../components/ui/Paginador'
import { useToast } from '../components/ui/toast-context'
import { mensajeDeError } from '../lib/errores'
import { filtrarPorTexto, paginar, TAMANIO_LISTADO } from '../lib/listado'
import { conCambios, enteroPositivo } from '../lib/parametrosUrl'
import { hayErrores, validarCategoria, type ErroresCategoria } from '../lib/validacion'
import styles from './Categorias.module.css'

export default function Categorias() {
    const { avisar } = useToast()
    const { data, error, isPending, refetch } = useCategorias()
    const crear = useCrearCategoria()
    const actualizar = useActualizarCategoria()
    const eliminar = useEliminarCategoria()

    const [editando, setEditando] = useState<Categoria | 'nueva' | null>(null)
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [errores, setErrores] = useState<ErroresCategoria>({})
    const [aEliminar, setAEliminar] = useState<Categoria | null>(null)

    // La búsqueda y la página viven en la dirección: sobreviven a recargar y a volver atrás.
    const [params, setParams] = useSearchParams()
    const busqueda = params.get('q') ?? ''
    const paginaPedida = enteroPositivo(params.get('pagina'))

    function buscar(texto: string) {
        setParams((actuales) => conCambios(actuales, { q: texto, pagina: null }), { replace: true })
    }

    function irAPagina(n: number) {
        setParams((actuales) => conCambios(actuales, { pagina: n > 1 ? String(n) : null }))
    }

    function abrirNueva() {
        setNombre('')
        setDescripcion('')
        setErrores({})
        setEditando('nueva')
    }

    function abrirEditar(categoria: Categoria) {
        setNombre(categoria.nombre)
        setDescripcion(categoria.descripcion ?? '')
        setErrores({})
        setEditando(categoria)
    }

    function guardar(e: FormEvent) {
        e.preventDefault()
        const encontrados = validarCategoria({ nombre, descripcion })
        setErrores(encontrados)
        if (hayErrores(encontrados) || editando === null) return

        const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() }
        const opciones = {
        onSuccess: () => {
            avisar(editando === 'nueva' ? 'Categoría creada' : 'Categoría actualizada', 'ok')
            setEditando(null)
        },
        onError: (err: unknown) => {
            // 400 = nombre repetido: se muestra junto al campo
            if (err instanceof ApiError && err.status === 400) setErrores({ nombre: err.message })
            else avisar(mensajeDeError(err), 'error')
        },
        }

        if (editando === 'nueva') crear.mutate(datos, opciones)
        else actualizar.mutate({ id: editando.id, datos }, opciones)
    }

    function confirmarEliminar() {
        if (!aEliminar) return
        eliminar.mutate(aEliminar.id, {
        onSuccess: () => avisar('Categoría eliminada', 'ok'),
        onError: (err) => avisar(mensajeDeError(err), 'error'),
        onSettled: () => setAEliminar(null),
        })
    }

    const ordenadas = [...(data ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    const coincidentes = filtrarPorTexto(ordenadas, busqueda, (c) => `${c.nombre} ${c.descripcion ?? ''}`)
    const pagina = paginar(coincidentes, paginaPedida, TAMANIO_LISTADO)

    const columnas: Columna<Categoria>[] = [
        { clave: 'nombre', titulo: 'Nombre', celda: (c) => c.nombre },
        { clave: 'descripcion', titulo: 'Descripción', celda: (c) => c.descripcion ?? '—' },
        {
        clave: 'acciones',
        titulo: 'Acciones',
        alinear: 'derecha',
        celda: (c) => (
            <div className={styles.acciones}>
            <Button variante="ghost" aria-label={`Editar ${c.nombre}`} onClick={() => abrirEditar(c)}>
                Editar
            </Button>
            <Button variante="ghost" aria-label={`Eliminar ${c.nombre}`} onClick={() => setAEliminar(c)}>
                Eliminar
            </Button>
            </div>
        ),
        },
    ]

    return (
        <>
        <div className={styles.cabecera}>
            <div className="page-head">
            <h2>Categorías</h2>
            <p className="page-sub">Organiza el catálogo por tipo de producto.</p>
            </div>
            <Button onClick={abrirNueva}>Nueva categoría</Button>
        </div>
        <div className="ticket-divider" />

        <div className={styles.herramientas}>
            <Field
            etiqueta="Buscar categoría"
            type="search"
            placeholder="Nombre o descripción"
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
            />
            {busqueda !== '' && (
            <Button variante="ghost" onClick={() => setParams({}, { replace: true })}>
                Limpiar búsqueda
            </Button>
            )}
        </div>

        {error && (
            <p className={styles.error}>
            No se pudieron cargar las categorías: {error.message}{' '}
            <Button variante="ghost" onClick={() => refetch()}>Reintentar</Button>
            </p>
        )}

        <DataTable
            columnas={columnas}
            filas={pagina.items}
            claveFila={(c) => c.id}
            cargando={isPending}
            vacio={
            busqueda !== ''
                ? 'Ninguna categoría coincide con la búsqueda.'
                : 'Aún no hay categorías. Crea la primera con «Nueva categoría».'
            }
        />

        {pagina.total > 0 && (
            <Paginador
            pagina={pagina.pagina}
            paginas={pagina.paginas}
            tamanio={TAMANIO_LISTADO}
            total={pagina.total}
            onCambiar={irAPagina}
            />
        )}

        <Dialog
            abierto={editando !== null}
            titulo={editando === 'nueva' ? 'Nueva categoría' : 'Editar categoría'}
            textoConfirmar="Guardar"
            formId="form-categoria"
            cargando={crear.isPending || actualizar.isPending}
            onCancelar={() => setEditando(null)}
        >
            <form id="form-categoria" className={styles.formulario} onSubmit={guardar} noValidate>
            <Field
                etiqueta="Nombre"
                value={nombre}
                error={errores.nombre}
                onChange={(e) => setNombre(e.target.value)}
            />
            <Field
                etiqueta="Descripción (opcional)"
                value={descripcion}
                error={errores.descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
            />
            </form>
        </Dialog>

        <Dialog
            abierto={aEliminar !== null}
            titulo="Eliminar categoría"
            textoConfirmar="Eliminar"
            peligro
            cargando={eliminar.isPending}
            onConfirmar={confirmarEliminar}
            onCancelar={() => setAEliminar(null)}
        >
            {`¿Eliminar la categoría «${aEliminar?.nombre ?? ''}»? Solo es posible si no tiene productos.`}
        </Dialog>
        </>
    )
}