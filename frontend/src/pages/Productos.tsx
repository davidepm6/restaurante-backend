import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import {
    useActualizarProducto,
    useCategorias,
    useCrearProducto,
    useDesactivarProducto,
    useProductos,
    type Producto,
    } from '../api/catalogo'
    import { useMe } from '../api/me'
    import { Button } from '../components/ui/Button'
    import { DataTable, type Columna } from '../components/ui/DataTable'
    import { Dialog } from '../components/ui/Dialog'
    import { Field } from '../components/ui/Field'
    import { Select } from '../components/ui/Select'
    import { useToast } from '../components/ui/toast-context'
    import { mensajeDeError } from '../lib/errores'
    import { formatoMoneda } from '../lib/format'
    import { contarStockBajo, estadoStock } from '../lib/stock'
    import {
    hayErrores,
    validarProducto,
    type DatosProductoForm,
    type ErroresProducto,
    } from '../lib/validacion'
    import styles from './Productos.module.css'

    const FORM_VACIO: DatosProductoForm = { nombre: '', precio: '', stock: '', stockMinimo: '0', categoriaId: '' }

    export default function Productos() {
    const { avisar } = useToast()
    const { data: me } = useMe()
    const esAdmin = me?.role === 'ADMINISTRADOR'

    const productos = useProductos()
    const categorias = useCategorias()
    const crear = useCrearProducto()
    const actualizar = useActualizarProducto()
    const desactivar = useDesactivarProducto()

    const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null)
    const [form, setForm] = useState<DatosProductoForm>(FORM_VACIO)
    const [errores, setErrores] = useState<ErroresProducto>({})
    const [aDesactivar, setADesactivar] = useState<Producto | null>(null)
    const [soloBajo, setSoloBajo] = useState(false)

    const listaCategorias = categorias.data ?? []
    const nombreCategoria = (id: number) => listaCategorias.find((c) => c.id === id)?.nombre ?? '—'
    const sinCategorias = !categorias.isPending && listaCategorias.length === 0

    const todos = productos.data ?? []
    const cantidadBajo = contarStockBajo(todos)
    const filas = soloBajo ? todos.filter((p) => p.stock_bajo) : todos

    function cambiar(campo: keyof DatosProductoForm, valor: string) {
        setForm((actual) => ({ ...actual, [campo]: valor }))
    }

    function abrirNuevo() {
        setForm(FORM_VACIO)
        setErrores({})
        setEditando('nuevo')
    }

    function abrirEditar(producto: Producto) {
        setForm({
        nombre: producto.nombre,
        precio: String(producto.precio),
        stock: String(producto.stock),
        stockMinimo: String(producto.stock_minimo),
        categoriaId: String(producto.categoria_id),
        })
        setErrores({})
        setEditando(producto)
    }

    function guardar(e: FormEvent) {
        e.preventDefault()
        const encontrados = validarProducto(form)
        setErrores(encontrados)
        if (hayErrores(encontrados) || editando === null) return

        const datos = {
        nombre: form.nombre.trim(),
        precio: Number(form.precio),
        stock: Number(form.stock),
        stock_minimo: Number(form.stockMinimo),
        categoria_id: Number(form.categoriaId),
        }
        const opciones = {
        onSuccess: () => {
            avisar(editando === 'nuevo' ? 'Producto creado' : 'Producto actualizado', 'ok')
            setEditando(null)
        },
        onError: (err: unknown) => avisar(mensajeDeError(err), 'error'),
        }

        if (editando === 'nuevo') crear.mutate(datos, opciones)
        else actualizar.mutate({ id: editando.id, datos }, opciones)
    }

    function confirmarDesactivar() {
        if (!aDesactivar) return
        desactivar.mutate(aDesactivar.id, {
        onSuccess: () => avisar('Producto desactivado', 'ok'),
        onError: (err) => avisar(mensajeDeError(err), 'error'),
        onSettled: () => setADesactivar(null),
        })
    }

    const columnas: Columna<Producto>[] = [
        { clave: 'nombre', titulo: 'Producto', celda: (p) => p.nombre },
        { clave: 'categoria', titulo: 'Categoría', celda: (p) => nombreCategoria(p.categoria_id) },
        { clave: 'precio', titulo: 'Precio', alinear: 'derecha', celda: (p) => formatoMoneda(p.precio) },
        {
        clave: 'stock',
        titulo: 'Stock',
        alinear: 'derecha',
        celda: (p) => {
            const estado = estadoStock(p)
            return (
            <span className={styles.celdaStock}>
                {p.stock}
                {estado === 'AGOTADO' && <span className={styles.agotado}>Agotado</span>}
                {estado === 'BAJO' && <span className={styles.bajo}>Stock bajo</span>}
            </span>
            )
        },
        },
    ]

    if (esAdmin) {
        columnas.push(
        {
            clave: 'minimo',
            titulo: 'Mínimo',
            alinear: 'derecha',
            celda: (p) => (p.stock_minimo > 0 ? p.stock_minimo : '—'),
        },
        {
            clave: 'acciones',
            titulo: 'Acciones',
            alinear: 'derecha',
            celda: (p) => (
            <div className={styles.acciones}>
                <Button variante="ghost" aria-label={`Editar ${p.nombre}`} onClick={() => abrirEditar(p)}>
                Editar
                </Button>
                <Button variante="ghost" aria-label={`Desactivar ${p.nombre}`} onClick={() => setADesactivar(p)}>
                Desactivar
                </Button>
            </div>
            ),
        },
        )
    }

    return (
        <>
        <div className={styles.cabecera}>
            <div className="page-head">
            <h2>Productos</h2>
            <p className="page-sub">
                {esAdmin ? 'Precio, stock y categoría de cada producto.' : 'Catálogo de productos disponibles (solo lectura).'}
            </p>
            </div>
            {esAdmin && (
            <Button onClick={abrirNuevo} disabled={sinCategorias}>
                Nuevo producto
            </Button>
            )}
        </div>
        <div className="ticket-divider" />

        {esAdmin && sinCategorias && (
            <p className={styles.aviso}>
            Para crear productos primero necesitas una categoría. <Link to="/categorias">Ir a Categorías</Link>
            </p>
        )}

        {esAdmin && (
            <div className={styles.herramientas}>
            <Button variante={soloBajo ? 'secundario' : 'ghost'} aria-pressed={soloBajo} onClick={() => setSoloBajo((v) => !v)}>
                Solo stock bajo ({cantidadBajo})
            </Button>
            </div>
        )}

        {productos.error && (
            <p className={styles.error}>
            No se pudieron cargar los productos: {productos.error.message}{' '}
            <Button variante="ghost" onClick={() => productos.refetch()}>Reintentar</Button>
            </p>
        )}

        <DataTable
            columnas={columnas}
            filas={filas}
            claveFila={(p) => p.id}
            cargando={productos.isPending}
            vacio={soloBajo ? 'Ningún producto tiene stock bajo.' : 'Aún no hay productos en el catálogo.'}
        />

        <Dialog
            abierto={editando !== null}
            titulo={editando === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}
            textoConfirmar="Guardar"
            formId="form-producto"
            cargando={crear.isPending || actualizar.isPending}
            onCancelar={() => setEditando(null)}
        >
            <form id="form-producto" className={styles.formulario} onSubmit={guardar} noValidate>
            <Field
                etiqueta="Nombre"
                value={form.nombre}
                error={errores.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
            />
            <div className={styles.fila}>
                <Field
                etiqueta="Precio (COP)"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                ayuda="En pesos, sin puntos."
                value={form.precio}
                error={errores.precio}
                onChange={(e) => cambiar('precio', e.target.value)}
                />
                <Field
                etiqueta="Stock"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.stock}
                error={errores.stock}
                onChange={(e) => cambiar('stock', e.target.value)}
                />
            </div>
            <div className={styles.fila}>
                <Field
                etiqueta="Stock mínimo"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                ayuda="Avisa cuando el stock llegue aquí. 0 = sin alerta."
                value={form.stockMinimo}
                error={errores.stockMinimo}
                onChange={(e) => cambiar('stockMinimo', e.target.value)}
                />
                <Select
                etiqueta="Categoría"
                value={form.categoriaId}
                error={errores.categoriaId}
                onChange={(e) => cambiar('categoriaId', e.target.value)}
                >
                <option value="">Elige una categoría</option>
                {listaCategorias.map((c) => (
                    <option key={c.id} value={c.id}>
                    {c.nombre}
                    </option>
                ))}
                </Select>
            </div>
            </form>
        </Dialog>

        <Dialog
            abierto={aDesactivar !== null}
            titulo="Desactivar producto"
            textoConfirmar="Desactivar"
            peligro
            cargando={desactivar.isPending}
            onConfirmar={confirmarDesactivar}
            onCancelar={() => setADesactivar(null)}
        >
            {`«${aDesactivar?.nombre ?? ''}» dejará de aparecer en el catálogo y en el punto de venta. Sus ventas anteriores se conservan. Por ahora no se puede reactivar desde la aplicación.`}
        </Dialog>
        </>
    )
}