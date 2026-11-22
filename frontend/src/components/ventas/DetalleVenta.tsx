import type { Venta } from '../../api/ventas'
import { formatoFechaHora } from '../../lib/fechas'
import { formatoMoneda } from '../../lib/format'
import { etiquetaMetodo } from '../../lib/pago'
import { DataTable, type Columna } from '../ui/DataTable'
import { Dialog } from '../ui/Dialog'
import styles from './DetalleVenta.module.css'
import { useComprobante } from './useComprobante'

interface DetalleVentaProps {
    venta: Venta
    onCerrar: () => void
    }

    export function DetalleVenta({ venta, onCerrar }: DetalleVentaProps) {
    const { descargar, descargando } = useComprobante()
    const anulada = venta.estado === 'ANULADA'

    // Una venta antigua puede repetir un producto en dos líneas, así que la clave es la posición.
    const filas = venta.detalles.map((d, i) => ({ ...d, clave: i }))
    const columnas: Columna<(typeof filas)[number]>[] = [
        { clave: 'producto', titulo: 'Producto', celda: (d) => d.nombre_producto },
        { clave: 'cantidad', titulo: 'Cant.', alinear: 'derecha', celda: (d) => d.cantidad },
        { clave: 'precio', titulo: 'Precio', alinear: 'derecha', celda: (d) => formatoMoneda(d.precio_unitario) },
        { clave: 'subtotal', titulo: 'Subtotal', alinear: 'derecha', celda: (d) => formatoMoneda(d.subtotal) },
    ]

    return (
        <Dialog
        abierto
        titulo={`Venta #${venta.id}`}
        textoConfirmar="Descargar comprobante"
        textoCancelar="Cerrar"
        cargando={descargando}
        onConfirmar={() => descargar(venta.id)}
        onCancelar={onCerrar}
        >
        <dl className={styles.datos}>
            <dt>Fecha</dt>
            <dd>{formatoFechaHora(venta.fecha)}</dd>
            <dt>Registrada por</dt>
            <dd>{venta.registrada_por_nombre ?? '—'}</dd>
            <dt>Pago</dt>
            <dd>{etiquetaMetodo(venta.metodo_pago)}</dd>
            <dt>Estado</dt>
            <dd className={anulada ? styles.anulada : styles.completada}>{anulada ? 'Anulada' : 'Completada'}</dd>
        </dl>

        {anulada && (
            <p className={styles.aviso}>
            Anulada
            {venta.anulada_en ? ` el ${formatoFechaHora(venta.anulada_en)}` : ''}
            {venta.anulada_por_nombre ? ` por ${venta.anulada_por_nombre}` : ''}. Motivo: {venta.motivo_anulacion ?? '—'}
            </p>
        )}

        <DataTable
            columnas={columnas}
            filas={filas}
            claveFila={(f) => f.clave}
            cargando={false}
            vacio="Esta venta no tiene productos."
        />

        <p className={styles.total}>
            Total <strong>{formatoMoneda(venta.total)}</strong>
        </p>
        </Dialog>
    )
}