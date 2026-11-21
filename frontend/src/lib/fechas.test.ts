import { describe, expect, it } from 'vitest'
import { diasEntre, fechaColombia, formatoFechaHora, sumarDias } from './fechas'

describe('fechaColombia', () => {
    it('a las 8 p. m. en Bogotá sigue siendo el mismo día, aunque en UTC ya sea el siguiente', () => {
        expect(fechaColombia(new Date('2031-05-10T01:00:00Z'))).toBe('2031-05-09')
    })

    it('a las 00:00 en Bogotá empieza el día nuevo', () => {
        expect(fechaColombia(new Date('2031-05-12T05:00:00Z'))).toBe('2031-05-12')
    })
    })

    describe('sumarDias', () => {
    it('suma días dentro del mes', () => {
        expect(sumarDias('2026-11-20', 3)).toBe('2026-11-23')
    })

    it('cruza el fin de mes y de año', () => {
        expect(sumarDias('2026-11-30', 1)).toBe('2026-12-01')
        expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    })

    it('resta días', () => {
        expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
    })

    it('respeta los años bisiestos', () => {
        expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
    })
    })

    describe('diasEntre', () => {
    it('es cero para el mismo día', () => {
        expect(diasEntre('2026-11-20', '2026-11-20')).toBe(0)
    })

    it('cuenta los días entre dos fechas', () => {
        expect(diasEntre('2026-11-01', '2026-11-30')).toBe(29)
    })

    it('es negativo si la segunda fecha es anterior', () => {
        expect(diasEntre('2026-11-20', '2026-11-10')).toBe(-10)
    })
    })

    describe('formatoFechaHora', () => {
    it('muestra la hora de Colombia y no la de UTC', () => {
        const texto = formatoFechaHora('2031-05-10T01:00:00Z') // 8:00 p. m. del 9 de mayo en Bogotá
        expect(texto).toMatch(/\b9\b/)
        expect(texto).toMatch(/8:00/)
    })
})