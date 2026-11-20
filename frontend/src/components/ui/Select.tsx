import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    etiqueta: string
    error?: string
}

export function Select({ etiqueta, error, id, children, ...resto }: SelectProps) {
    const idAuto = useId()
    const idCampo = id ?? idAuto
    const idError = `${idCampo}-error`

    return (
        <div className={styles.campo}>
        <label htmlFor={idCampo} className={styles.etiqueta}>
            {etiqueta}
        </label>
        <select
            id={idCampo}
            className={error ? `${styles.selector} ${styles.conError}` : styles.selector}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? idError : undefined}
            {...resto}
        >
            {children}
        </select>
        {error && <p id={idError} role="alert" className={styles.error}>{error}</p>}
        </div>
    )
}