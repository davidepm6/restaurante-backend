import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { TAMANIO_PAGINA, useAnularVenta, useEmpleadosVentas, useVentas, type Venta } from '../api/ventas'
import { Button } from '../components/ui/Button'
import { DataTable, type Columna } from '../components/ui/DataTable'
import { Dialog } from '../components/ui/Dialog'
import { Field } from '../components/ui/Field'
import { Paginador } from '../components/ui/Paginador'
import { Select } from '../components/ui/Select'
import { useToast } from '../components/ui/toast-context'
import { mensajeDeError } from '../lib/errores'
import { fechaColombia, formatoFechaHora, sumarDias } from '../lib/fechas'
import { hayFiltrosExtra, leerFiltrosVentas } from '../lib/filtrosVentas'
import { formatoMoneda } from '../lib/format'
import { validarMotivo } from '../lib/motivo'
import { METODOS_PAGO, etiquetaMetodo } from '../lib/pago'
import { conCambios } from '../lib/parametrosUrl'
import { validarRango } from '../lib/rango'
import { resumenProductos } from '../lib/ventas'
import styles from './Ventas.module.css'

const RESUMEN_VACIO = { total_vendido: 0, completadas: 0, anuladas: 0 }

export default function Ventas() {
    const { avisar } = useToast()
    const hoy = fechaColombia()

    // Fechas, página y filtros viven en la dirección: sobreviven a recargar, a compartir el enlace y a volver atrás.
    const [params, setParams] = useSearchParams()
    const filtros = leerFiltrosVentas(params, hoy)
    const hayExtra = hayFiltrosExtra(filtros)

    const errorRango = validarRango(filtros.desde, filtros.hasta)
    const ventas = useVentas(filtros, errorRango === null)
    const empleados = useEmpleadosVentas()
    const anularVenta = useAnularVenta()

    const [aAnular, setAAnular] = useState<Venta | null>(null)
    const [motivo, setMotivo] = useState('')
    const [errorMotivo, setErrorMotivo] = useState<string | null>(null)

    /** Un cambio de filtro vuelve a la primera página y no llena el historial del navegador. */
    function cambiar(cambios: Record<string, string | null>) {
        setParams((actuales) => conCambios(actuales, { pagina: null, ...cambios }), { replace: true })
    }

    function irAPagina(n: number) {
        setParams((actuales) => conCambios(actuales, { pagina: n > 1 ? String(n) : null }))
    }

    const datos = errorRango ? undefined : ventas.data
    const filas = datos?.items ?? []
    const resumen = datos?.resumen ?? RESUMEN_VACIO
    const cargando = errorRango === null && ventas.isPending
    const actualizando = ventas.isPlaceholderData

    const listaEmpleados = empleados.data ?? []
    const empleadoConocido = filtros.empleado === '' || listaEmpleados.some((e) => e.id === filtros.empleado)

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
            value={filtros.desde}
            max={hoy}
            onChange={(e) => cambiar({ desde: e.target.value })}
            />
            <Field
            etiqueta="Hasta"
            type="date"
            value={filtros.hasta}
            max={hoy}
            onChange={(e) => cambiar({ hasta: e.target.value })}
            />
            <div className={styles.atajos}>
            <Button variante="ghost" onClick={() => cambiar({ desde: null, hasta: null })}>Hoy</Button>
            <Button
                variante="ghost"
                onClick={() => cambiar({ desde: sumarDias(hoy, -1), hasta: sumarDias(hoy, -1) })}
            >
                Ayer
            </Button>
            <Button variante="ghost" onClick={() => cambiar({ desde: sumarDias(hoy, -6), hasta: hoy })}>
                Últimos 7 días
            </Button>
            </div>
        </div>

        <div className={styles.filtros}>
            <Select etiqueta="Estado" value={filtros.estado} onChange={(e) => cambiar({ estado: e.target.value })}>
            <option value="">Todos</option>
            <option value="COMPLETADA">Completadas</option>
            <option value="ANULADA">Anuladas</option>
            </Select>
            <Select etiqueta="Método de pago" value={filtros.metodo} onChange={(e) => cambiar({ pago: e.target.value })}>
            <option value="">Todos</option>
            {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>
                {m.etiqueta}
                </option>
            ))}
            </Select>
            <Select etiqueta="Empleado" value={filtros.empleado} onChange={(e) => cambiar({ empleado: e.target.value })}>
            <option value="">Todos</option>
            {listaEmpleados.map((e) => (
                <option key={e.id} value={e.id}>
                {e.nombre ?? 'Sin nombre'}
                </option>
            ))}
            {!empleadoConocido && <option value={filtros.empleado}>Empleado seleccionado</option>}
            </Select>
            {hayExtra && (
            <Button variante="ghost" onClick={() => cambiar({ estado: null, pago: null, empleado: null })}>
                Quitar filtros
            </Button>
            )}
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
        {hayExtra && <p className={styles.nota}>Los totales corresponden solo a las ventas que cumplen los filtros.</p>}

        <div className={actualizando ? styles.actualizando : undefined} aria-busy={actualizando}>
            <DataTable
            columnas={columnas}
            filas={filas}
            claveFila={(v) => v.id}
            cargando={cargando}
            vacio={hayExtra ? 'Ninguna venta coincide con los filtros.' : 'No hay ventas en este período.'}
            />
        </div>

        {datos && datos.total > 0 && (
            <Paginador
            pagina={datos.pagina}
            paginas={datos.paginas}
            tamanio={TAMANIO_PAGINA}
            total={datos.total}
            onCambiar={irAPagina}
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