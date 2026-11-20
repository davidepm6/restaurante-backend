import { describe, expect, it } from 'vitest'
import { METODOS_PAGO, etiquetaMetodo } from './pago'

describe('pago', () => {
    it('ofrece efectivo, tarjeta y transferencia', () => {
        expect(METODOS_PAGO.map((m) => m.valor)).toEqual(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'])
    })

    it('traduce cada método a su etiqueta', () => {
        expect(etiquetaMetodo('EFECTIVO')).toBe('Efectivo')
        expect(etiquetaMetodo('TRANSFERENCIA')).toBe('Transferencia')
    })

    it('muestra un guion cuando la venta no tiene método (ventas antiguas)', () => {
        expect(etiquetaMetodo(null)).toBe('—')
        expect(etiquetaMetodo(undefined)).toBe('—')
    })
})