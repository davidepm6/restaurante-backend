import { describe, expect, it } from 'vitest'
import { rangoMostrado } from './paginacion'

describe('rangoMostrado', () => {
    it('la primera página empieza en 1', () => {
        expect(rangoMostrado(1, 25, 120)).toEqual({ desde: 1, hasta: 25 })
    })

    it('una página intermedia', () => {
        expect(rangoMostrado(2, 25, 120)).toEqual({ desde: 26, hasta: 50 })
    })

    it('la última página termina en el total', () => {
        expect(rangoMostrado(5, 25, 120)).toEqual({ desde: 101, hasta: 120 })
    })

    it('sin resultados son ceros', () => {
        expect(rangoMostrado(1, 25, 0)).toEqual({ desde: 0, hasta: 0 })
    })

    it('una página fuera de rango también da ceros', () => {
        expect(rangoMostrado(9, 25, 120)).toEqual({ desde: 0, hasta: 0 })
    })
})