export type EstadoStock = 'AGOTADO' | 'BAJO' | 'NORMAL'

/** Un producto sin unidades se ve como agotado, aunque además tenga stock bajo. */
export function estadoStock(producto: { stock: number; stock_bajo: boolean }): EstadoStock {
    if (producto.stock <= 0) return 'AGOTADO'
    return producto.stock_bajo ? 'BAJO' : 'NORMAL'
}

/** Cuántos productos están marcados con stock bajo por el servidor. */
export function contarStockBajo(productos: { stock_bajo: boolean }[]): number {
    return productos.filter((p) => p.stock_bajo).length
}