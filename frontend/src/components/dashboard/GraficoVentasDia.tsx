import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { VentaDia } from '../../api/dashboard'
import { abreviarMonto, formatoDiaCorto, hayVentas } from '../../lib/dashboard'
import { formatoMoneda } from '../../lib/format'
import styles from './GraficoVentasDia.module.css'

export function GraficoVentasDia({ datos }: { datos: VentaDia[] }) {
    const serie = datos.map((d) => ({ ...d, etiqueta: formatoDiaCorto(d.fecha) }))
    const total = datos.reduce((suma, d) => suma + d.total, 0)

    return (
        <div>
        {hayVentas(datos) ? (
            <div
            role="img"
            aria-label={`Gráfico de barras con las ventas de los últimos ${datos.length} días. Total: ${formatoMoneda(total)}.`}
            className={styles.grafico}
            >
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={abreviarMonto} width={56} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(valor) => formatoMoneda(Number(valor))} />
                <Bar dataKey="total" name="Vendido" fill="var(--brick, #a8442e)" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        ) : (
            <p className={styles.vacio}>No hay ventas en este período.</p>
        )}

        <details className={styles.detalles}>
            <summary>Ver datos en tabla</summary>
            <table className={styles.tabla}>
            <thead>
                <tr>
                <th scope="col">Día</th>
                <th scope="col">Ventas</th>
                <th scope="col">Total</th>
                </tr>
            </thead>
            <tbody>
                {datos.map((d) => (
                <tr key={d.fecha}>
                    <th scope="row">{formatoDiaCorto(d.fecha)}</th>
                    <td>{d.ventas}</td>
                    <td>{formatoMoneda(d.total)}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </details>
        </div>
    )
}