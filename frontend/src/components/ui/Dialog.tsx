import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './Dialog.module.css'

interface DialogProps {
    abierto: boolean
    titulo: string
    children: ReactNode
    textoConfirmar?: string
    textoCancelar?: string
    peligro?: boolean
    cargando?: boolean
    /** Id de un <form> dentro del diálogo: el botón de confirmar lo envía. */
    formId?: string
    /** Se ignora cuando hay formId (la acción la define el onSubmit del formulario). */
    onConfirmar?: () => void
    onCancelar: () => void
}

export function Dialog({
    abierto,
    titulo,
    children,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar',
    peligro = false,
    cargando = false,
    formId,
    onConfirmar,
    onCancelar,
}: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null)
    const idTitulo = useId()

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (abierto && !el.open) el.showModal()
        if (!abierto && el.open) el.close()
    }, [abierto])

    return (
        <dialog
        ref={ref}
        className={styles.dialogo}
        aria-labelledby={idTitulo}
        onCancel={(e) => {
            e.preventDefault()
            onCancelar()
        }}
        onClick={(e) => {
            if (e.target === e.currentTarget) onCancelar()
        }}
        >
        <div className={styles.contenido}>
            <h2 id={idTitulo} className={styles.titulo}>{titulo}</h2>
            <div className={styles.cuerpo}>{children}</div>
            <div className={styles.acciones}>
            <Button variante="ghost" onClick={onCancelar} disabled={cargando}>{textoCancelar}</Button>
            <Button
                variante={peligro ? 'peligro' : 'primario'}
                type={formId ? 'submit' : 'button'}
                form={formId}
                onClick={formId ? undefined : onConfirmar}
                cargando={cargando}
            >
                {textoConfirmar}
            </Button>
            </div>
        </div>
        </dialog>
    )
}