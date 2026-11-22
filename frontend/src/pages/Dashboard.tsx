import { useState } from 'react'
import { Link } from 'react-router'
import { useDashboard, type Periodo } from '../api/dashboard'
import { GraficoVentasDia } from '../components/dashboard/GraficoVentasDia'
import { ListaBarras } from '../components/dashboard/ListaBarras'
import { TarjetaIndicador } from '../components/dashboard/TarjetaIndicador'
import { Button } from '../components/ui/Button'
import { etiquetaMetodoPanel, formatoDiaCorto, nombreMes, porcentaje } from '../lib/dashboard'
import { formatoMoneda } from '../lib/format'
import styles from './Dashboard.module.css'

const DIAS_DEL_GRAFICO = [7, 14, 30]

function Tarjetas({ periodo }: { periodo: Periodo }) {
    const tono = periodo.balance > 0 ? 'positivo' : periodo.balance < 0 ? 'negativo' : 'normal'
    return (
        <div className={styles.tarjetas}>
        <TarjetaIndicador etiqueta="Ventas" valor={String(periodo.ventas)} />
        <TarjetaIndicador etiqueta="Ingresos" valor={formatoMoneda(periodo.ingresos)} />
        <TarjetaIndicador etiqueta="Egresos" valor={formatoMoneda(periodo.egresos)} />
        <TarjetaIndicador etiqueta="Balance" valor={formatoMoneda(periodo.balance)} tono={tono} />
        </div>
    )
    }

    export default function Dashboard() {
    const [dias, setDias] = useState(14)
    const { data, error, isPending, isFetching, refetch } = useDashboard(dias)

    return (
        <>
        <div className={styles.cabecera}>
            <div className="page-head">
            <h2>Panel</h2>
            <p className="page-sub">Indicadores del negocio en hora de Colombia. Las ventas anuladas no se cuentan.</p>
            </div>
            <Button variante="ghost" onClick={() => refetch()} cargando={isFetching && !isPending}>
            Actualizar
            </Button>
        </div>
        <div className="ticket-divider" />

        {isPending && <p>Cargando indicadores…</p>}

        {error && (
            <p className={styles.error} role="alert">
            {data ? 'No se pudieron actualizar los indicadores' : 'No se pudieron cargar los indicadores'}: {error.message}{' '}
            <Button variante="ghost" onClick={() => refetch()}>Reintentar</Button>
            </p>
        )}

        {data && (
            <>
            <section className={styles.seccion} aria-label="Hoy">
                <h3>Hoy</h3>
                <p className={styles.nota}>{formatoDiaCorto(data.hoy)}</p>
                <Tarjetas periodo={data.dia} />
            </section>

            <section className={styles.seccion} aria-label="Este mes">
                <h3>Este mes</h3>
                <p className={styles.nota}>{nombreMes(data.mes.desde)}, hasta hoy</p>
                <Tarjetas periodo={data.mes} />
            </section>

            <section className={styles.seccion} aria-label="Ventas por día">
                <h3>Ventas por día</h3>
                <div className={styles.selector} role="group" aria-label="Días a mostrar">
                {DIAS_DEL_GRAFICO.map((n) => (
                    <Button
                    key={n}
                    variante={dias === n ? 'secundario' : 'ghost'}
                    aria-pressed={dias === n}
                    onClick={() => setDias(n)}
                    >
                    {n} días
                    </Button>
                ))}
                </div>
                <GraficoVentasDia datos={data.ventas_por_dia} />
            </section>

            <div className={styles.paneles}>
                <section className={styles.panel} aria-label="Por método de pago">
                <h3>Por método de pago</h3>
                <p className={styles.nota}>{nombreMes(data.mes.desde)}</p>
                {data.por_metodo_pago.length === 0 ? (
                    <p className={styles.vacio}>Aún no hay ventas este mes.</p>
                ) : (
                    <ListaBarras
                    items={data.por_metodo_pago.map((m) => ({
                        clave: m.metodo,
                        etiqueta: etiquetaMetodoPanel(m.metodo),
                        valor: m.total,
                        texto: `${formatoMoneda(m.total)} (${porcentaje(m.total, data.mes.ingresos)} %) · ${m.ventas} ventas`,
                    }))}
                    />
                )}
                </section>

                <section className={styles.panel} aria-label="Más vendidos">
                <h3>Más vendidos</h3>
                <p className={styles.nota}>{nombreMes(data.mes.desde)}, por unidades</p>
                {data.mas_vendidos.length === 0 ? (
                    <p className={styles.vacio}>Aún no hay ventas este mes.</p>
                ) : (
                    <ListaBarras
                    items={data.mas_vendidos.map((p) => ({
                        clave: p.producto_id,
                        etiqueta: p.producto,
                        valor: p.cantidad,
                        texto: `${p.cantidad} unidades · ${formatoMoneda(p.total)}`,
                    }))}
                    />
                )}
                </section>

                <section className={styles.panel} aria-label="Stock bajo">
                <h3>Stock bajo</h3>
                <p className={styles.nota}>
                    {data.stock_bajo.cantidad === 0
                    ? 'Ningún producto está por debajo de su mínimo.'
                    : `${data.stock_bajo.cantidad} producto(s) por debajo de su mínimo, los más urgentes primero.`}
                </p>
                {data.stock_bajo.productos.length > 0 && (
                    <ul className={styles.stock}>
                    {data.stock_bajo.productos.map((p) => (
                        <li key={p.id} className={styles.stockFila}>
                        <span>{p.nombre}</span>
                        <span className={styles.nota}>
                            {p.stock} de {p.stock_minimo}
                        </span>
                        </li>
                    ))}
                    </ul>
                )}
                {data.stock_bajo.cantidad > 0 && (
                    <Link className={styles.enlace} to="/productos?bajo=1">
                    Ver todos en el catálogo
                    </Link>
                )}
                </section>
            </div>
            </>
        )}
        </>
    )
}