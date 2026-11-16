import { describe, expect, it } from 'vitest'
import { formatoMoneda } from './format'

describe('formatoMoneda', () => {
    it('formatea pesos colombianos sin decimales', () => {
        expect(formatoMoneda(15000)).toMatch(/15\.000/)
    })

    it('formatea cero', () => {
        expect(formatoMoneda(0)).toMatch(/0/)
    })
})