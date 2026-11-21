import { describe, expect, it } from 'vitest'
import { validarMotivo } from './motivo'

describe('validarMotivo', () => {
    it('acepta un motivo normal', () => {
        expect(validarMotivo('Error de digitación')).toBeNull()
    })

    it('rechaza un motivo vacío o de solo espacios', () => {
        expect(validarMotivo('')).not.toBeNull()
        expect(validarMotivo('     ')).not.toBeNull()
    })

    it('rechaza un motivo demasiado corto, ignorando los espacios de los extremos', () => {
        expect(validarMotivo('  ab  ')).not.toBeNull()
        expect(validarMotivo('abc')).toBeNull()
    })

    it('rechaza un motivo de más de 255 caracteres', () => {
        expect(validarMotivo('x'.repeat(256))).not.toBeNull()
        expect(validarMotivo('x'.repeat(255))).toBeNull()
    })
})