import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export interface Columna<T> {
    clave: string
    titulo: string
    celda: (fila: T) => ReactNode
    alinear?: 'izquierda' | 'derecha'
    }

    interface DataTableProps<T> {
    columnas: Columna<T>[]
    filas: T[]
    claveFila: (fila: T) => string | number
    cargando?: boolean
    vacio?: ReactNode
    }

    export function DataTable<T>({
    columnas,
    filas,
    claveFila,
    cargando = false,
    vacio = 'No hay registros para mostrar.',
    }: DataTableProps<T>) {
    const clasesCelda = (alinear?: 'izquierda' | 'derecha') => (alinear === 'derecha' ? styles.derecha : undefined)

    return (
        <div className={styles.envoltura}>
        <table className={styles.tabla}>
            <thead>
            <tr>
                {columnas.map((c) => (
                <th key={c.clave} scope="col" className={clasesCelda(c.alinear)}>
                    {c.titulo}
                </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {cargando ? (
                <tr><td colSpan={columnas.length} className={styles.mensaje}>Cargando…</td></tr>
            ) : filas.length === 0 ? (
                <tr><td colSpan={columnas.length} className={styles.mensaje}>{vacio}</td></tr>
            ) : (
                filas.map((fila) => (
                <tr key={claveFila(fila)}>
                    {columnas.map((c) => (
                    <td key={c.clave} className={clasesCelda(c.alinear)}>{c.celda(fila)}</td>
                    ))}
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    )
}