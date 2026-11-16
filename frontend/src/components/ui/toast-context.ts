import { createContext, useContext } from 'react'

export type TipoAviso = 'ok' | 'error' | 'info'

export interface ToastContexto {
    avisar: (mensaje: string, tipo?: TipoAviso) => void
}

export const ContextoToast = createContext<ToastContexto | null>(null)

export function useToast(): ToastContexto {
    const ctx = useContext(ContextoToast)
    if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
    return ctx
}