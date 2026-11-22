import styles from './TarjetaIndicador.module.css'

interface TarjetaIndicadorProps {
    etiqueta: string
    valor: string
    tono?: 'normal' | 'positivo' | 'negativo'
    }

    export function TarjetaIndicador({ etiqueta, valor, tono = 'normal' }: TarjetaIndicadorProps) {
    const clase = [styles.valor, tono === 'positivo' ? styles.positivo : '', tono === 'negativo' ? styles.negativo : '']
        .filter(Boolean)
        .join(' ')
    return (
        <div className={styles.tarjeta}>
        <span className={styles.etiqueta}>{etiqueta}</span>
        <strong className={clase}>{valor}</strong>
        </div>
    )
}