import { describe, expect, it } from 'vitest'
import type { Venta } from '../api/ventas'
import { resumenProductos } from './ventas'

const venta = (detalles: Venta['detalles']): Venta => ({
    id: 1,
    fecha: '2026-11-20T15:00:00Z',
    total: 0,
    metodo_pago: 'EFECTIVO',
    estado: 'COMPLETADA',
    registrada_por_nombre: 'Ana',
    anulada_en: null,
    anulada_por_nombre: null,
    motivo_anulacion: null,
    detalles,
})

const linea = (nombre: string, cantidad: number) => ({
    producto_id: 1,
    nombre_producto: nombre,
    cantidad,
    precio_unitario: 1000,
  subtotal: 1000 * cantidad,
})

describe('resumenProductos', () => {
    it('lista los productos con su cantidad', () => {
    expect(resumenProductos(venta([linea('Limonada', 2), linea('Brownie', 1)]))).toBe('2× Limonada, 1× Brownie')
    })

it('abrevia cuando hay muchos productos', () => {
    const v = venta([linea('A', 1), linea('B', 1), linea('C', 1), linea('D', 1), linea('E', 1)])
    expect(resumenProductos(v)).toBe('1× A, 1× B, 1× C y 2 más')
    })
})