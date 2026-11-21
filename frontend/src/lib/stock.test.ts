import { describe, expect, it } from 'vitest'
import { contarStockBajo, estadoStock } from './stock'

describe('estadoStock', () => {
    it('con unidades y sin alerta es normal', () => {
        expect(estadoStock({ stock: 20, stock_bajo: false })).toBe('NORMAL')
    })

    it('con unidades y alerta es bajo', () => {
        expect(estadoStock({ stock: 3, stock_bajo: true })).toBe('BAJO')
    })

    it('sin unidades es agotado, tenga o no mínimo definido', () => {
        expect(estadoStock({ stock: 0, stock_bajo: false })).toBe('AGOTADO')
        expect(estadoStock({ stock: 0, stock_bajo: true })).toBe('AGOTADO')
    })
    })

    describe('contarStockBajo', () => {
    it('cuenta solo los marcados por el servidor', () => {
        expect(contarStockBajo([{ stock_bajo: true }, { stock_bajo: false }, { stock_bajo: true }])).toBe(2)
    })

    it('con una lista vacía es cero', () => {
        expect(contarStockBajo([])).toBe(0)
    })
})