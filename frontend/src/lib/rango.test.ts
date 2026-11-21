import { describe, expect, it } from 'vitest'
import { validarRango } from './rango'

describe('validarRango', () => {
    it('acepta un solo día', () => {
        expect(validarRango('2026-11-20', '2026-11-20')).toBeNull()
    })

    it('acepta el máximo de 62 días y rechaza 63', () => {
        expect(validarRango('2026-10-01', '2026-11-01')).toBeNull() // 32 días
        expect(validarRango('2026-01-01', '2026-03-03')).toBeNull() // 62 días
        expect(validarRango('2026-01-01', '2026-03-04')).toBe('Elige un rango de máximo 62 días.')
    })

    it('exige las dos fechas', () => {
        expect(validarRango('', '2026-11-20')).toBe('Elige las dos fechas.')
        expect(validarRango('2026-11-20', '')).toBe('Elige las dos fechas.')
    })

    it('rechaza una fecha final anterior a la inicial', () => {
        expect(validarRango('2026-11-20', '2026-11-10')).toBe('La fecha final no puede ser anterior a la inicial.')
    })
})