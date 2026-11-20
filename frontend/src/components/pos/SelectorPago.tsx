import { useId } from 'react'
import type { MetodoPago } from '../../api/ventas'
import { METODOS_PAGO } from '../../lib/pago'
import styles from './SelectorPago.module.css'

interface SelectorPagoProps {
    valor: MetodoPago | null
    onCambiar: (metodo: MetodoPago) => void
    deshabilitado?: boolean
}

export function SelectorPago({ valor, onCambiar, deshabilitado = false }: SelectorPagoProps) {
    const nombre = useId()

    return (
        <fieldset className={styles.grupo} disabled={deshabilitado}>
        <legend className={styles.leyenda}>Método de pago</legend>
        <div className={styles.opciones}>
            {METODOS_PAGO.map((m) => (
            <label key={m.valor} className={valor === m.valor ? `${styles.opcion} ${styles.elegida}` : styles.opcion}>
                <input
                type="radio"
                name={nombre}
                value={m.valor}
                checked={valor === m.valor}
                onChange={() => onCambiar(m.valor)}
                />
                {m.etiqueta}
            </label>
            ))}
        </div>
        </fieldset>
    )
}