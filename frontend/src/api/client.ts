import { useCallback } from 'react'
import { useAuth } from '@clerk/react'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
    }

    export function useApi() {
    const { getToken } = useAuth()

    return useCallback(
        async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
        const token = await getToken()
        if (!token) throw new ApiError(401, 'No hay una sesión activa')

        const headers = new Headers(init.headers)
        headers.set('Authorization', `Bearer ${token}`)
        if (init.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json')
        }

        const res = await fetch(`${API_URL}${path}`, { ...init, headers })
        if (!res.ok) {
            const cuerpo = await res.json().catch(() => null)
            const detalle = typeof cuerpo?.detail === 'string' ? cuerpo.detail : res.statusText
            throw new ApiError(res.status, detalle)
        }
        if (res.status === 204) return undefined as T
        return (await res.json()) as T
        },
        [getToken],
    )
}