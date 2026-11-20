export type ErroresCategoria = Partial<Record<'nombre' | 'descripcion', string>>

export interface DatosCategoria {
    nombre: string
    descripcion: string
}

export function validarCategoria(datos: DatosCategoria): ErroresCategoria {
    const errores: ErroresCategoria = {}
    const nombre = datos.nombre.trim()

    if (nombre.length === 0) errores.nombre = 'Escribe el nombre de la categoría.'
    else if (nombre.length > 100) errores.nombre = 'El nombre no puede superar los 100 caracteres.'

    if (datos.descripcion.trim().length > 255) {
        errores.descripcion = 'La descripción no puede superar los 255 caracteres.'
    }
    return errores
    }

    export function hayErrores(errores: object): boolean {
    return Object.keys(errores).length > 0
    }