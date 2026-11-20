import { ApiError } from '../api/client'

export function mensajeDeError(error: unknown): string {
    return error instanceof ApiError ? error.message : 'No se pudo completar la acción. Intenta de nuevo.'
    }