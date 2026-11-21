import type { Venta } from '../api/ventas'

export interface ResumenVentas {
    totalVendido: number
    completadas: number
    anuladas: number
}

/** Las ventas anuladas no suman al total vendido (igual que en los reportes del servidor). */
export function resumenVentas(ventas: Venta[]): ResumenVentas {
    return ventas.reduce<ResumenVentas>(
        (r, v) =>
        v.estado === 'ANULADA'
            ? { ...r, anuladas: r.anuladas + 1 }
            : { ...r, totalVendido: r.totalVendido + v.total, completadas: r.completadas + 1 },
        { totalVendido: 0, completadas: 0, anuladas: 0 },
    )
}

/** Texto corto de los productos de una venta: «2× Limonada, 1× Brownie y 2 más». */
export function resumenProductos(venta: Venta, maximo = 3): string {
    const partes = venta.detalles.map((d) => `${d.cantidad}× ${d.nombre_producto}`)
    if (partes.length <= maximo) return partes.join(', ')
    return `${partes.slice(0, maximo).join(', ')} y ${partes.length - maximo} más`
}