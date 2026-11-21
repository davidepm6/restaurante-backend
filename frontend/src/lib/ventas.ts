import type { Venta } from '../api/ventas'

/** Texto corto de los productos de una venta: «2× Limonada, 1× Brownie y 2 más». */
export function resumenProductos(venta: Venta, maximo = 3): string {
    const partes = venta.detalles.map((d) => `${d.cantidad}× ${d.nombre_producto}`)
    if (partes.length <= maximo) return partes.join(', ')
    return `${partes.slice(0, maximo).join(', ')} y ${partes.length - maximo} más`
}