export class ErrorDescarga extends Error {
    readonly status: number

    constructor(mensaje: string, status: number) {
        super(mensaje)
        this.name = 'ErrorDescarga'
        this.status = status
    }
    }

    export function nombreComprobante(ventaId: number): string {
    return `comprobante-${ventaId}.pdf`
    }

    /** Mensaje para mostrar al usuario cuando una descarga falla. */
    export function mensajeDescarga(error: unknown): string {
    if (error instanceof ErrorDescarga) return error.message
    // Un fallo de red hace que fetch lance un TypeError («Failed to fetch»).
    if (error instanceof TypeError) return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
    return 'No se pudo descargar el archivo.'
    }

    /** Entrega un archivo al navegador y libera la dirección temporal que se creó para él. */
    export function guardarArchivo(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombre
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    // Se espera un poco para no cancelar una descarga que apenas empieza.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
}