import { porcentaje } from '../../lib/dashboard'
import styles from './ListaBarras.module.css'

export interface ItemBarra {
    clave: string | number
    etiqueta: string
    valor: number
    texto: string
    }

    export function ListaBarras({ items }: { items: ItemBarra[] }) {
    const maximo = Math.max(...items.map((i) => i.valor), 0)
    return (
        <ul className={styles.lista}>
        {items.map((item) => (
            <li key={item.clave} className={styles.fila}>
            <div className={styles.cabecera}>
                <span className={styles.etiqueta}>{item.etiqueta}</span>
                <span className={styles.texto}>{item.texto}</span>
            </div>
            <div className={styles.pista} aria-hidden="true">
                <div className={styles.barra} style={{ width: `${porcentaje(item.valor, maximo)}%` }} />
            </div>
            </li>
        ))}
        </ul>
    )
}