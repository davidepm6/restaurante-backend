/** Devuelve el mensaje de error del motivo de anulación, o null si es válido. */
export function validarMotivo(texto: string): string | null {
    const motivo = texto.trim()
    if (motivo.length < 3) return 'Escribe el motivo de la anulación (mínimo 3 caracteres).'
    if (motivo.length > 255) return 'El motivo no puede superar los 255 caracteres.'
    return null
}