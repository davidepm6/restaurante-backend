/** Entero mayor o igual que 1; cualquier otra cosa (vacío, texto, 0, decimales) se convierte en el valor por defecto. */
export function enteroPositivo(valor: string | null, porDefecto = 1): number {
    if (valor === null || valor.trim() === '') return porDefecto
    const n = Number(valor)
    return Number.isInteger(n) && n >= 1 ? n : porDefecto
}

/** Copia los parámetros aplicando los cambios; un valor nulo o vacío borra el parámetro. */
export function conCambios(
    actuales: URLSearchParams,
    cambios: Record<string, string | null>,
): URLSearchParams {
    const nuevos = new URLSearchParams(actuales)
    for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === '') nuevos.delete(clave)
        else nuevos.set(clave, valor)
    }
    return nuevos
}