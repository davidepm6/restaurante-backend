import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ContextoToast, type TipoAviso } from './toast-context'
import styles from './ToastProvider.module.css'

interface Aviso {
    id: number
    tipo: TipoAviso
    mensaje: string
    }

    const DURACION_MS = 4000
    let contador = 0

    export function ToastProvider({ children }: { children: ReactNode }) {
    const [avisos, setAvisos] = useState<Aviso[]>([])

    const quitar = useCallback((id: number) => {
        setAvisos((actuales) => actuales.filter((a) => a.id !== id))
    }, [])

    const avisar = useCallback(
        (mensaje: string, tipo: TipoAviso = 'info') => {
        const id = ++contador
        setAvisos((actuales) => [...actuales, { id, tipo, mensaje }])
        window.setTimeout(() => quitar(id), DURACION_MS)
        },
        [quitar],
    )

    const valor = useMemo(() => ({ avisar }), [avisar])

    return (
        <ContextoToast.Provider value={valor}>
        {children}
        <div className={styles.pila} role="status" aria-live="polite">
            {avisos.map((a) => (
            <div key={a.id} className={`${styles.aviso} ${styles[a.tipo]}`}>
                {a.mensaje}
            </div>
            ))}
        </div>
        </ContextoToast.Provider>
    )
}