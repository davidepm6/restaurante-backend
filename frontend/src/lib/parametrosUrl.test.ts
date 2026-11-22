import { describe, expect, it } from 'vitest'
import { conCambios, enteroPositivo } from './parametrosUrl'

describe('enteroPositivo', () => {
    it('lee un entero válido', () => {
        expect(enteroPositivo('3')).toBe(3)
    })

    it('usa el valor por defecto con cualquier dato inválido', () => {
        for (const malo of [null, '', '  ', 'abc', '0', '-2', '1.5']) {
        expect(enteroPositivo(malo)).toBe(1)
        }
    })

    it('acepta otro valor por defecto', () => {
        expect(enteroPositivo('x', 5)).toBe(5)
    })
    })

    describe('conCambios', () => {
    it('agrega y reemplaza parámetros', () => {
        const nuevos = conCambios(new URLSearchParams('q=abc'), { q: 'xyz', categoria: '2' })
        expect(nuevos.get('q')).toBe('xyz')
        expect(nuevos.get('categoria')).toBe('2')
    })

    it('borra los parámetros nulos o vacíos', () => {
        const nuevos = conCambios(new URLSearchParams('q=abc&pagina=3&bajo=1'), { q: '', pagina: null })
        expect(nuevos.has('q')).toBe(false)
        expect(nuevos.has('pagina')).toBe(false)
        expect(nuevos.get('bajo')).toBe('1')
    })

    it('no modifica los parámetros originales', () => {
        const originales = new URLSearchParams('q=abc')
        conCambios(originales, { q: 'otro' })
        expect(originales.get('q')).toBe('abc')
    })
})