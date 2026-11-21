import { describe, expect, it } from 'vitest'
import type { Producto } from '../api/catalogo'
import { filtrarProductos } from './busqueda'

const p = (id: number, nombre: string, categoria_id: number): Producto => ({
    id, nombre, precio: 1000, stock: 5, stock_minimo: 0, stock_bajo: false, categoria_id, activo: true, creado_en: '',
})

const LISTA = [p(1, 'Limonada natural', 1), p(2, 'Hamburguesa clásica', 2), p(3, 'Jugo de mora', 1)]

describe('filtrarProductos', () => {
    it('sin texto devuelve todos', () => {
        expect(filtrarProductos(LISTA, '', null)).toHaveLength(3)
})

it('ignora mayúsculas y tildes', () => {
    expect(filtrarProductos(LISTA, 'CLASICA', null).map((x) => x.id)).toEqual([2])
    expect(filtrarProductos(LISTA, 'limonada', null).map((x) => x.id)).toEqual([1])
})

it('encuentra coincidencias parciales en cualquier parte del nombre', () => {
    expect(filtrarProductos(LISTA, 'mor', null).map((x) => x.id)).toEqual([3])
})

it('filtra por categoría', () => {
    expect(filtrarProductos(LISTA, '', 1).map((x) => x.id)).toEqual([1, 3])
})

it('combina texto y categoría', () => {
    expect(filtrarProductos(LISTA, 'jugo', 2)).toEqual([])
})

it('respeta el límite de resultados', () => {
    expect(filtrarProductos(LISTA, '', null, 2)).toHaveLength(2)
    })
})