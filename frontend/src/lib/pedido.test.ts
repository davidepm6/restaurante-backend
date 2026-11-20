import { describe, expect, it } from 'vitest'
import type { Producto } from '../api/catalogo'
import {
    aItemsVenta,
    limitarCantidad,
    pedidoReducer,
    reconciliarPedido,
    subtotal,
    totalPedido,
    type Pedido,
} from './pedido'

const producto = (id: number, stock: number, precio = 1000, nombre = `Producto ${id}`): Producto => ({
    id, nombre, precio, stock, categoria_id: 1, activo: true, creado_en: '',
})

describe('limitarCantidad', () => {
    it('mantiene valores válidos', () => expect(limitarCantidad(3, 5)).toBe(3))
    it('cero, negativos, NaN y decimales inválidos se vuelven 1', () => {
        expect(limitarCantidad(0, 5)).toBe(1)
        expect(limitarCantidad(-3, 5)).toBe(1)
        expect(limitarCantidad(Number.NaN, 5)).toBe(1)
    })
    it('no supera el stock', () => expect(limitarCantidad(99, 5)).toBe(5))
    it('trunca decimales', () => expect(limitarCantidad(2.7, 5)).toBe(2))
})

describe('pedidoReducer', () => {
    it('agrega un producto nuevo con cantidad 1', () => {
        const pedido = pedidoReducer([], { tipo: 'agregar', producto: producto(1, 5, 6000, 'Limonada') })
        expect(pedido).toEqual([{ productoId: 1, nombre: 'Limonada', precio: 6000, stock: 5, cantidad: 1 }])
    })

    it('agregar de nuevo el mismo producto suma una unidad', () => {
        const p = producto(1, 5)
        let pedido: Pedido = []
        pedido = pedidoReducer(pedido, { tipo: 'agregar', producto: p })
        pedido = pedidoReducer(pedido, { tipo: 'agregar', producto: p })
        expect(pedido).toHaveLength(1)
        expect(pedido[0].cantidad).toBe(2)
    })

    it('nunca supera el stock disponible', () => {
        const p = producto(1, 2)
        let pedido: Pedido = []
        for (let i = 0; i < 5; i++) pedido = pedidoReducer(pedido, { tipo: 'agregar', producto: p })
        expect(pedido[0].cantidad).toBe(2)
    })

    it('no agrega un producto agotado', () => {
        expect(pedidoReducer([], { tipo: 'agregar', producto: producto(1, 0) })).toEqual([])
    })

    it('cambiar la cantidad respeta el mínimo de 1 y el stock de la línea', () => {
        const inicial = pedidoReducer([], { tipo: 'agregar', producto: producto(1, 4) })
        expect(pedidoReducer(inicial, { tipo: 'cantidad', productoId: 1, cantidad: 0 })[0].cantidad).toBe(1)
        expect(pedidoReducer(inicial, { tipo: 'cantidad', productoId: 1, cantidad: 100 })[0].cantidad).toBe(4)
        expect(pedidoReducer(inicial, { tipo: 'cantidad', productoId: 1, cantidad: 3 })[0].cantidad).toBe(3)
    })

    it('quita una línea y vacía el pedido', () => {
        let pedido: Pedido = []
        pedido = pedidoReducer(pedido, { tipo: 'agregar', producto: producto(1, 5) })
        pedido = pedidoReducer(pedido, { tipo: 'agregar', producto: producto(2, 5) })
        pedido = pedidoReducer(pedido, { tipo: 'quitar', productoId: 1 })
        expect(pedido.map((l) => l.productoId)).toEqual([2])
        expect(pedidoReducer(pedido, { tipo: 'vaciar' })).toEqual([])
    })
})

describe('totales', () => {
    const pedido: Pedido = [
    { productoId: 1, nombre: 'Limonada', precio: 6000, stock: 10, cantidad: 2 },
    { productoId: 2, nombre: 'Hamburguesa', precio: 22000, stock: 10, cantidad: 1 },
]
    it('el subtotal es precio por cantidad', () => expect(subtotal(pedido[0])).toBe(12000))
    it('el total suma todos los subtotales', () => expect(totalPedido(pedido)).toBe(34000))
    it('un pedido vacío vale cero', () => expect(totalPedido([])).toBe(0))
    it('se convierte en los ítems que espera la API', () => {
        expect(aItemsVenta(pedido)).toEqual([
        { producto_id: 1, cantidad: 2 },
        { producto_id: 2, cantidad: 1 },
        ])
    })
})

describe('reconciliarPedido', () => {
  const pedido: Pedido = [{ productoId: 1, nombre: 'Limonada', precio: 6000, stock: 10, cantidad: 5 }]

  it('recorta la cantidad si el stock bajó', () => {
    const resultado = reconciliarPedido(pedido, [producto(1, 3, 6000, 'Limonada')])
    expect(resultado[0].cantidad).toBe(3)
    expect(resultado[0].stock).toBe(3)
  })

  it('actualiza el precio si cambió', () => {
    expect(reconciliarPedido(pedido, [producto(1, 10, 7000, 'Limonada')])[0].precio).toBe(7000)
  })

  it('quita los productos que ya no existen o están agotados', () => {
    expect(reconciliarPedido(pedido, [])).toEqual([])
    expect(reconciliarPedido(pedido, [producto(1, 0, 6000, 'Limonada')])).toEqual([])
  })

  it('devuelve el mismo pedido cuando no hay cambios', () => {
    expect(reconciliarPedido(pedido, [producto(1, 10, 6000, 'Limonada')])).toBe(pedido)
  })
})