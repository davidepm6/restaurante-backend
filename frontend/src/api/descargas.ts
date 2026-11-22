import { useAuth } from '@clerk/react'
import { useCallback } from 'react'
import { ErrorDescarga, guardarArchivo } from '../lib/descarga'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

async function mensajeDeRespuesta(respuesta: Response): Promise<string> {
    try {
        const cuerpo = await respuesta.json()
        if (typeof cuerpo?.detail === 'string') return cuerpo.detail
    } catch {
        // La respuesta no era JSON: se usa un mensaje genérico.
    }
    return 'No se pudo descargar el archivo.'
    }

    /** Descarga un archivo de la API con el token de la sesión (no se puede abrir con un enlace normal). */
    export function useDescargarArchivo() {
    const { getToken } = useAuth()

    return useCallback(
        async (ruta: string, nombreArchivo: string): Promise<void> => {
        const token = await getToken()
        if (!token) throw new ErrorDescarga('Tu sesión expiró. Vuelve a iniciar sesión.', 401)

        const respuesta = await fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!respuesta.ok) throw new ErrorDescarga(await mensajeDeRespuesta(respuesta), respuesta.status)

        guardarArchivo(await respuesta.blob(), nombreArchivo)
        },
        [getToken],
    )
}