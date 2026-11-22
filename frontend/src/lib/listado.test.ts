import { describe, expect, it } from 'vitest'
import { filtrarPorTexto, paginar } from './listado'

const NOMBRES = ['Hamburguesa clásica', 'Limonada natural', 'Jugo de mora']

describe('filtrarPorTexto', () => {
    it('sin término devuelve todo', () => {
        expect(filtrarPorTexto(NOMBRES, '', (n) => n)).toHaveLength(3)
        expect(filtrarPorTexto(NOMBRES, '   ', (n) => n)).toHaveLength(3)
    })

    it('ignora mayúsculas y tildes', () => {
        expect(filtrarPorTexto(NOMBRES, 'CLASICA', (n) => n)).toEqual(['Hamburguesa clásica'])
    })

    it('encuentra coincidencias parciales en cualquier parte', () => {
        expect(filtrarPorTexto(NOMBRES, 'mor', (n) => n)).toEqual(['Jugo de mora'])
    })

    it('puede buscar en varios campos a la vez', () => {
        const items = [{ nombre: 'Bebidas', descripcion: 'Jugos y gaseosas' }, { nombre: 'Postres', descripcion: null }]
        const texto = (c: (typeof items)[number]) => `${c.nombre} ${c.descripcion ?? ''}`
        expect(filtrarPorTexto(items, 'gaseosa', texto)).toEqual([items[0]])
    })

    it('sin coincidencias devuelve una lista vacía', () => {
        expect(filtrarPorTexto(NOMBRES, 'zzz', (n) => n)).toEqual([])
    })
    })

    describe('paginar', () => {
    const numeros = Array.from({ length: 30 }, (_, i) => i + 1)

    it('devuelve la primera página', () => {
        const p = paginar(numeros, 1, 25)
        expect(p.items).toHaveLength(25)
        expect(p).toMatchObject({ pagina: 1, paginas: 2, total: 30 })
    })

    it('devuelve la última página con lo que sobra', () => {
        const p = paginar(numeros, 2, 25)
        expect(p.items).toEqual([26, 27, 28, 29, 30])
        expect(p.pagina).toBe(2)
    })

    it('ajusta una página demasiado alta a la última', () => {
        expect(paginar(numeros, 99, 25).pagina).toBe(2)
    })

    it('ajusta una página menor que 1 o inválida a la primera', () => {
        expect(paginar(numeros, 0, 25).pagina).toBe(1)
        expect(paginar(numeros, -4, 25).pagina).toBe(1)
        expect(paginar(numeros, Number.NaN, 25).pagina).toBe(1)
    })

    it('una lista vacía tiene una sola página', () => {
        expect(paginar([], 1, 25)).toEqual({ items: [], pagina: 1, paginas: 1, total: 0 })
    })

    it('una lista justa de una página no crea una segunda', () => {
        expect(paginar(numeros.slice(0, 25), 1, 25).paginas).toBe(1)
    })
})