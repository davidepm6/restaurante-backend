import { describe, expect, it } from 'vitest'
import { fechaColombia } from './fechas'

describe('fechaColombia', () => {
    it('a las 8 p. m. en Bogotá sigue siendo el mismo día, aunque en UTC ya sea el siguiente', () => {
        expect(fechaColombia(new Date('2031-05-10T01:00:00Z'))).toBe('2031-05-09')
    })

    it('a las 00:00 en Bogotá empieza el día nuevo', () => {
        expect(fechaColombia(new Date('2031-05-12T05:00:00Z'))).toBe('2031-05-12')
    })
})