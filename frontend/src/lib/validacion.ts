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

    export interface DatosProductoForm {
    nombre: string
    precio: string
    stock: string
    stockMinimo: string
    categoriaId: string
    }

    export type ErroresProducto = Partial<Record<keyof DatosProductoForm, string>>

    const PRECIO_MAXIMO = 99_999_999
    const STOCK_MAXIMO = 1_000_000

    export function validarProducto(datos: DatosProductoForm): ErroresProducto {
    const errores: ErroresProducto = {}

    const nombre = datos.nombre.trim()
    if (nombre.length === 0) errores.nombre = 'Escribe el nombre del producto.'
    else if (nombre.length > 100) errores.nombre = 'El nombre no puede superar los 100 caracteres.'

    const precioTexto = datos.precio.trim()
    const precio = Number(precioTexto)
    if (precioTexto === '') errores.precio = 'Escribe el precio.'
    else if (!Number.isInteger(precio)) errores.precio = 'El precio debe ser un número entero de pesos.'
    else if (precio <= 0) errores.precio = 'El precio debe ser mayor que cero.'
    else if (precio > PRECIO_MAXIMO) errores.precio = 'El precio no puede superar 99.999.999.'

    const stockTexto = datos.stock.trim()
    const stock = Number(stockTexto)
    if (stockTexto === '') errores.stock = 'Escribe el stock.'
    else if (!Number.isInteger(stock)) errores.stock = 'El stock debe ser un número entero.'
    else if (stock < 0) errores.stock = 'El stock no puede ser negativo.'
    else if (stock > STOCK_MAXIMO) errores.stock = 'El stock no puede superar 1.000.000.'

    const minimoTexto = datos.stockMinimo.trim()
    const minimo = Number(minimoTexto)
    if (minimoTexto === '') errores.stockMinimo = 'Escribe el stock mínimo (0 si no quieres alerta).'
    else if (!Number.isInteger(minimo)) errores.stockMinimo = 'El stock mínimo debe ser un número entero.'
    else if (minimo < 0) errores.stockMinimo = 'El stock mínimo no puede ser negativo.'
    else if (minimo > STOCK_MAXIMO) errores.stockMinimo = 'El stock mínimo no puede superar 1.000.000.'

    if (datos.categoriaId === '') errores.categoriaId = 'Elige una categoría.'

    return errores
    }

    export function hayErrores(errores: object): boolean {
    return Object.keys(errores).length > 0
}