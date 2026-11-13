import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Variante = 'primario' | 'secundario' | 'ghost' | 'peligro'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: Variante
    cargando?: boolean
}

export function Button({
    variante = 'primario',
    cargando = false,
    disabled,
    className,
    children,
    type = 'button',
    ...resto
}: ButtonProps) {
    const clases = [styles.boton, styles[variante], className].filter(Boolean).join(' ')

    return (
        <button
        type={type}
        className={clases}
        disabled={disabled || cargando}
        aria-busy={cargando || undefined}
        {...resto}
        >
        {cargando && <span className={styles.spinner} aria-hidden="true" />}
        {children}
        </button>
    )
}