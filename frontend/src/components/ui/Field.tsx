import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    etiqueta: string
    error?: string
    ayuda?: string
}

export function Field({ etiqueta, error, ayuda, id, ...resto }: FieldProps) {
    const idAuto = useId()
    const idCampo = id ?? idAuto
    const idError = `${idCampo}-error`
    const idAyuda = `${idCampo}-ayuda`
    const describedBy = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(' ') || undefined

    return (
        <div className={styles.campo}>
        <label htmlFor={idCampo} className={styles.etiqueta}>
            {etiqueta}
        </label>
        <input
            id={idCampo}
            className={error ? `${styles.entrada} ${styles.conError}` : styles.entrada}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...resto}
        />
        {ayuda && <p id={idAyuda} className={styles.ayuda}>{ayuda}</p>}
        {error && <p id={idError} role="alert" className={styles.error}>{error}</p>}
        </div>
    )
}