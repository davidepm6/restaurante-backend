import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { TAMANIO_PAGINA, useAnularVenta, useVentas, type Venta } from '../api/ventas'
import { Button } from '../components/ui/Button'
import { DataTable, type Columna } from '../components/ui/DataTable'
import { Dialog } from '../components/ui/Dialog'
import { Field } from '../components/ui/Field'
import { Paginador } from '../components/ui/Paginador'
import { useToast } from '../components/ui/toast-context'
import { mensajeDeError } from '../lib/errores'
import { fechaColombia, formatoFechaHora, sumarDias } from '../lib/fechas'
import { formatoMoneda } from '../lib/format'
import { validarMotivo } from '../lib/motivo'
import { etiquetaMetodo } from '../lib/pago'
import { validarRango } from '../lib/rango'
import { resumenProductos } from '../lib/ventas'
import styles from './Ventas.module.css'

const RESUMEN_VACIO = { total_vendido: 0, completadas: 0, anuladas: 0 }

export default function Ventas() {
    const { avisar } = useToast()
    const [desde, setDesde] = useState(() => fechaColombia())
    const [hasta, setHasta] = useState(() => fechaColombia())
    const [pagina, setPagina] = useState(1)

    const errorRango = validarRango(desde, hasta)
    const ventas = useVentas(desde, hasta, pagina, errorRango === null)
    const anularVenta = useAnularVenta()

    const [aAnular, setAAnular] = useState<Venta | null>(null)
    const [motivo, setMotivo] = useState('')
    const [errorMotivo, setErrorMotivo] = useState<string | null>(null)

    const datos = errorRango ? undefined : ventas.data
    const filas = datos?.items ?? []
    const resumen = datos?.resumen ?? RESUMEN_VACIO
    const cargando = errorRango === null && ventas.isPending
    const actualizando = ventas.isPlaceholderData

    // Cualquier cambio del rango vuelve a la primera página.
    function cambiarRango(inicio: string, fin: string) {
        setDesde(inicio)
        setHasta(fin)
        setPagina(1)
    }

    function abrirAnular(venta: Venta) {
        setMotivo('')
        setErrorMotivo(null)
        setAAnular(venta)
    }

    function anular(e: FormEvent) {
        e.preventDefault()
        if (!aAnular) return
        const problema = validarMotivo(motivo)
        setErrorMotivo(problema)
        if (problema) return

        anularVenta.mutate(
        { id: aAnular.id, motivo: motivo.trim() },
        {
            onSuccess: () => avisar(`Venta #${aAnular.id} anulada. El stock volvió al inventario.`, 'ok'),
            onError: (err) => {
            if (err instanceof ApiError && err.status === 409) avisar('Esa venta ya estaba anulada.', 'info')
            else avisar(mensajeDeError(err), 'error')
            },
            onSettled: () => setAAnular(null),
        },
        )
    }

    const columnas: Columna<Venta>[] = [
        { clave: 'id', titulo: 'N.º', celda: (v) => `#${v.id}` },
        { clave: 'fecha', titulo: 'Fecha y hora', celda: (v) => formatoFechaHora(v.fecha) },
        { clave: 'empleado', titulo: 'Empleado', celda: (v) => v.registrada_por_nombre ?? '—' },
        { clave: 'productos', titulo: 'Productos', celda: (v) => resumenProductos(v) },
        { clave: 'pago', titulo: 'Pago', celda: (v) => etiquetaMetodo(v.metodo_pago) },
        {
        clave: 'total',
        titulo: 'Total',
        alinear: 'derecha',
        celda: (v) => (
            <span className={v.estado === 'ANULADA' ? styles.tachado : undefined}>{formatoMoneda(v.total)}</span>
        ),
        },
        {
        clave: 'estado',
        titulo: 'Estado',
        celda: (v) =>
            v.estado === 'ANULADA' ? (
            <div className={styles.estadoAnulada}>
                <span className={styles.anulada}>Anulada</span>
                <span className={styles.motivo}>
                {v.motivo_anulacion}
                {v.anulada_por_nombre ? ` · ${v.anulada_por_nombre}` : ''}
                </span>
            </div>
            ) : (
            <span className={styles.completada}>Completada</span>
            ),
        },
        {
        clave: 'acciones',
        titulo: 'Acciones',
        alinear: 'derecha',
        celda: (v) =>
            v.estado === 'COMPLETADA' ? (
            <Button variante="ghost" aria-label={`Anular venta ${v.id}`} onClick={() => abrirAnular(v)}>
                Anular
            </Button>
            ) : null,
        },
    ]

    const hoy = fechaColombia()

    return (
        <>
        <div className="page-head">
            <h2>Ventas</h2>
            <p className="page-sub">Consulta las ventas por fecha y anula las que se registraron por error.</p>
        </div>
        <div className="ticket-divider" />

        <div className={styles.filtros}>
            <Field
            etiqueta="Desde"
            type="date"
            value={desde}
            max={hoy}
            onChange={(e) => cambiarRango(e.target.value, hasta)}
            />
            <Field
            etiqueta="Hasta"
            type="date"
            value={hasta}
            max={hoy}
            onChange={(e) => cambiarRango(desde, e.target.value)}
            />
            <div className={styles.atajos}>
            <Button variante="ghost" onClick={() => cambiarRango(hoy, hoy)}>Hoy</Button>
            <Button variante="ghost" onClick={() => cambiarRango(sumarDias(hoy, -1), sumarDias(hoy, -1))}>Ayer</Button>
            <Button variante="ghost" onClick={() => cambiarRango(sumarDias(hoy, -6), hoy)}>Últimos 7 días</Button>
            </div>
        </div>

        {errorRango && <p className={styles.error} role="alert">{errorRango}</p>}

        {ventas.error && !errorRango && (
            <p className={styles.error}>
            No se pudieron cargar las ventas: {ventas.error.message}{' '}
            <Button variante="ghost" onClick={() => ventas.refetch()}>Reintentar</Button>
            </p>
        )}

        <section className={styles.resumen} aria-label="Resumen del período">
            <div className={styles.tarjeta}>
            <span className={styles.etiqueta}>Vendido (sin anuladas)</span>
            <strong className={styles.valor}>{formatoMoneda(resumen.total_vendido)}</strong>
            </div>
            <div className={styles.tarjeta}>
            <span className={styles.etiqueta}>Ventas completadas</span>
            <strong className={styles.valor}>{resumen.completadas}</strong>
            </div>
            <div className={styles.tarjeta}>
            <span className={styles.etiqueta}>Anuladas</span>
            <strong className={styles.valor}>{resumen.anuladas}</strong>
            </div>
        </section>

        <div className={actualizando ? styles.actualizando : undefined} aria-busy={actualizando}>
            <DataTable
            columnas={columnas}
            filas={filas}
            claveFila={(v) => v.id}
            cargando={cargando}
            vacio="No hay ventas en este período."
            />
        </div>

        {datos && datos.total > 0 && (
            <Paginador
            pagina={datos.pagina}
            paginas={datos.paginas}
            tamanio={TAMANIO_PAGINA}
            total={datos.total}
            onCambiar={setPagina}
            deshabilitado={actualizando}
            />
        )}

        <Dialog
            abierto={aAnular !== null}
            titulo={aAnular ? `Anular venta #${aAnular.id}` : 'Anular venta'}
            textoConfirmar="Anular venta"
            peligro
            formId="form-anulacion"
            cargando={anularVenta.isPending}
            onCancelar={() => setAAnular(null)}
        >
            {aAnular && (
            <form id="form-anulacion" className={styles.formulario} onSubmit={anular} noValidate>
                <p>
                La venta por {formatoMoneda(aAnular.total)} quedará anulada y el stock volverá al inventario:{' '}
                <strong>{aAnular.detalles.map((d) => `${d.cantidad}× ${d.nombre_producto}`).join(', ')}</strong>. Esta
                acción no se puede deshacer.
                </p>
                <Field
                etiqueta="Motivo de la anulación"
                value={motivo}
                error={errorMotivo ?? undefined}
                onChange={(e) => setMotivo(e.target.value)}
                />
            </form>
            )}
        </Dialog>
        </>
    )
}