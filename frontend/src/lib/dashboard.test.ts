import { describe, expect, it } from 'vitest'
import { abreviarMonto, etiquetaMetodoPanel, formatoDiaCorto, hayVentas, nombreMes, porcentaje } from './dashboard'

describe('formatoDiaCorto', () => {
    it('muestra el día y el mes abreviado', () => {
        expect(formatoDiaCorto('2026-11-21')).toBe('21 nov')
        expect(formatoDiaCorto('2026-01-05')).toBe('5 ene')
        expect(formatoDiaCorto('2026-12-31')).toBe('31 dic')
    })
    })

    describe('nombreMes', () => {
    it('muestra el mes con mayúscula inicial y el año', () => {
        expect(nombreMes('2026-11-01')).toBe('Noviembre 2026')
        expect(nombreMes('2027-03-15')).toBe('Marzo 2027')
    })
    })

    describe('porcentaje', () => {
    it('calcula la parte sobre el total', () => {
        expect(porcentaje(25, 100)).toBe(25)
        expect(porcentaje(1, 3)).toBe(33)
    })

    it('con un total de cero o negativo es cero', () => {
        expect(porcentaje(10, 0)).toBe(0)
        expect(porcentaje(10, -5)).toBe(0)
    })

    it('nunca sale del rango de 0 a 100', () => {
        expect(porcentaje(500, 100)).toBe(100)
        expect(porcentaje(-5, 100)).toBe(0)
    })
    })

    describe('etiquetaMetodoPanel', () => {
    it('traduce los métodos conocidos y el caso sin método', () => {
        expect(etiquetaMetodoPanel('EFECTIVO')).toBe('Efectivo')
        expect(etiquetaMetodoPanel('TRANSFERENCIA')).toBe('Transferencia')
        expect(etiquetaMetodoPanel('SIN_METODO')).toBe('Sin método (ventas antiguas)')
    })
    })

    describe('hayVentas', () => {
    it('es falso cuando todos los días están en cero', () => {
        expect(hayVentas([{ fecha: '2026-11-20', ventas: 0, total: 0 }])).toBe(false)
        expect(hayVentas([])).toBe(false)
    })

    it('es verdadero con que un día tenga ventas', () => {
        expect(hayVentas([{ fecha: '2026-11-20', ventas: 0, total: 0 }, { fecha: '2026-11-21', ventas: 1, total: 500 }])).toBe(true)
    })
    })

    describe('abreviarMonto', () => {
    it('abrevia miles y millones', () => {
        expect(abreviarMonto(12_000)).toBe('12 mil')
        expect(abreviarMonto(1_500_000)).toBe('1,5 M')
        expect(abreviarMonto(2_000_000)).toBe('2 M')
    })

    it('deja los montos pequeños como están', () => {
        expect(abreviarMonto(0)).toBe('0')
        expect(abreviarMonto(950)).toBe('950')
    })
})