import { describe, expect, it } from 'vitest'
import type { Venta } from '../api/ventas'
import { resumenProductos, resumenVentas } from './ventas'

const venta = (
    id: number,
    total: number,
    estado: Venta['estado'],
    detalles: Venta['detalles'] = [],
    ): Venta => ({
    id,
    fecha: '2026-11-20T15:00:00Z',
    total,
    metodo_pago: 'EFECTIVO',
    estado,
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

    describe('resumenVentas', () => {
    it('suma solo las ventas completadas y cuenta las anuladas aparte', () => {
        const resumen = resumenVentas([
        venta(1, 20000, 'COMPLETADA'),
        venta(2, 6000, 'COMPLETADA'),
        venta(3, 50000, 'ANULADA'),
        ])
        expect(resumen).toEqual({ totalVendido: 26000, completadas: 2, anuladas: 1 })
    })

    it('con una lista vacía todo es cero', () => {
        expect(resumenVentas([])).toEqual({ totalVendido: 0, completadas: 0, anuladas: 0 })
    })
    })

    describe('resumenProductos', () => {
    it('lista los productos con su cantidad', () => {
        const v = venta(1, 0, 'COMPLETADA', [linea('Limonada', 2), linea('Brownie', 1)])
        expect(resumenProductos(v)).toBe('2× Limonada, 1× Brownie')
    })

    it('abrevia cuando hay muchos productos', () => {
        const v = venta(1, 0, 'COMPLETADA', [linea('A', 1), linea('B', 1), linea('C', 1), linea('D', 1), linea('E', 1)])
        expect(resumenProductos(v)).toBe('1× A, 1× B, 1× C y 2 más')
    })
})