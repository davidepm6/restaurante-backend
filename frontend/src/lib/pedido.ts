import type { Producto } from '../api/catalogo'
import type { ItemVenta } from '../api/ventas'

export interface LineaPedido {
    productoId: number
    nombre: string
    precio: number
    stock: number
    cantidad: number
}

export type Pedido = LineaPedido[]

export type AccionPedido =
    | { tipo: 'agregar'; producto: Producto }
    | { tipo: 'cantidad'; productoId: number; cantidad: number }
    | { tipo: 'quitar'; productoId: number }
    | { tipo: 'vaciar' }
    | { tipo: 'sincronizar'; productos: Producto[] }

/** Entero entre 1 y el stock. Cualquier valor inválido se convierte en 1. */
export function limitarCantidad(cantidad: number, stock: number): number {
    const entera = Math.trunc(cantidad)
    if (!Number.isFinite(entera) || entera < 1) return 1
    return Math.min(entera, Math.max(stock, 1))
}

export function puedeAgregar(pedido: Pedido, producto: Producto): boolean {
    if (producto.stock < 1) return false
    const linea = pedido.find((l) => l.productoId === producto.id)
    return !linea || linea.cantidad < producto.stock
}

/** Pone el pedido al día con el catálogo: actualiza precios y stock, recorta cantidades y quita lo que ya no existe. */
export function reconciliarPedido(pedido: Pedido, productos: Producto[]): Pedido {
    const porId = new Map(productos.map((p) => [p.id, p]))
    const nuevo: Pedido = []
    let cambio = false

    for (const linea of pedido) {
        const producto = porId.get(linea.productoId)
        if (!producto || producto.stock < 1) {
        cambio = true
        continue
        }
        const actualizada: LineaPedido = {
        productoId: linea.productoId,
        nombre: producto.nombre,
        precio: producto.precio,
        stock: producto.stock,
        cantidad: Math.min(linea.cantidad, producto.stock),
        }
        if (
        actualizada.nombre !== linea.nombre ||
        actualizada.precio !== linea.precio ||
        actualizada.stock !== linea.stock ||
        actualizada.cantidad !== linea.cantidad
        ) {
        cambio = true
        }
        nuevo.push(actualizada)
    }

    return cambio ? nuevo : pedido
}

export function pedidoReducer(pedido: Pedido, accion: AccionPedido): Pedido {
    switch (accion.tipo) {
    case 'agregar': {
        const { producto } = accion
        if (!puedeAgregar(pedido, producto)) return pedido
        if (pedido.some((l) => l.productoId === producto.id)) {
        return pedido.map((l) =>
            l.productoId === producto.id ? { ...l, cantidad: l.cantidad + 1, stock: producto.stock } : l,
        )
    }
    return [
        ...pedido,
        { productoId: producto.id, nombre: producto.nombre, precio: producto.precio, stock: producto.stock, cantidad: 1 },
    ]
    }
    case 'cantidad':
        return pedido.map((l) =>
        l.productoId === accion.productoId ? { ...l, cantidad: limitarCantidad(accion.cantidad, l.stock) } : l,
    )
    case 'quitar':
        return pedido.filter((l) => l.productoId !== accion.productoId)
    case 'vaciar':
        return []
    case 'sincronizar':
        return reconciliarPedido(pedido, accion.productos)
    }
}

export function subtotal(linea: LineaPedido): number {
  return linea.precio * linea.cantidad
}

export function totalPedido(pedido: Pedido): number {
    return pedido.reduce((acumulado, linea) => acumulado + subtotal(linea), 0)
}

export function aItemsVenta(pedido: Pedido): ItemVenta[] {
    return pedido.map((l) => ({ producto_id: l.productoId, cantidad: l.cantidad }))
}