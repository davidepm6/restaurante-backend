import { describe, expect, it } from 'vitest'
import { hayErrores, validarCategoria, validarProducto, type DatosProductoForm } from './validacion'

describe('validarCategoria', () => {
    it('acepta un nombre válido con descripción vacía', () => {
        expect(hayErrores(validarCategoria({ nombre: 'Bebidas', descripcion: '' }))).toBe(false)
    })

    it('rechaza un nombre vacío', () => {
        expect(validarCategoria({ nombre: '', descripcion: '' }).nombre).toBe('Escribe el nombre de la categoría.')
    })

    it('rechaza un nombre de solo espacios', () => {
        expect(validarCategoria({ nombre: '    ', descripcion: '' }).nombre).toBeDefined()
    })

    it('rechaza un nombre de más de 100 caracteres', () => {
        expect(validarCategoria({ nombre: 'a'.repeat(101), descripcion: '' }).nombre).toBeDefined()
    })

    it('rechaza una descripción de más de 255 caracteres', () => {
        expect(validarCategoria({ nombre: 'Bebidas', descripcion: 'x'.repeat(256) }).descripcion).toBeDefined()
    })
    })

    const valido: DatosProductoForm = {
    nombre: 'Limonada',
    precio: '6000',
    stock: '40',
    stockMinimo: '5',
    categoriaId: '1',
    }

    describe('validarProducto', () => {
    it('acepta un producto válido', () => {
        expect(hayErrores(validarProducto(valido))).toBe(false)
    })

    it('acepta stock cero', () => {
        expect(hayErrores(validarProducto({ ...valido, stock: '0' }))).toBe(false)
    })

    it('exige nombre', () => {
        expect(validarProducto({ ...valido, nombre: '   ' }).nombre).toBe('Escribe el nombre del producto.')
    })

    it('exige un precio mayor que cero', () => {
        expect(validarProducto({ ...valido, precio: '0' }).precio).toBe('El precio debe ser mayor que cero.')
        expect(validarProducto({ ...valido, precio: '-5' }).precio).toBe('El precio debe ser mayor que cero.')
    })

    it('exige un precio entero', () => {
        expect(validarProducto({ ...valido, precio: '12.5' }).precio).toBeDefined()
        expect(validarProducto({ ...valido, precio: 'abc' }).precio).toBeDefined()
    })

    it('no acepta un precio vacío ni demasiado alto', () => {
        expect(validarProducto({ ...valido, precio: '' }).precio).toBe('Escribe el precio.')
        expect(validarProducto({ ...valido, precio: '100000000' }).precio).toBeDefined()
    })

    it('no acepta stock negativo, decimal ni vacío', () => {
        expect(validarProducto({ ...valido, stock: '-1' }).stock).toBe('El stock no puede ser negativo.')
        expect(validarProducto({ ...valido, stock: '1.5' }).stock).toBeDefined()
        expect(validarProducto({ ...valido, stock: '' }).stock).toBe('Escribe el stock.')
    })

    it('acepta un stock mínimo de cero, que significa sin alerta', () => {
        expect(hayErrores(validarProducto({ ...valido, stockMinimo: '0' }))).toBe(false)
    })

    it('no acepta un stock mínimo negativo, decimal, vacío ni exagerado', () => {
        expect(validarProducto({ ...valido, stockMinimo: '-1' }).stockMinimo).toBe('El stock mínimo no puede ser negativo.')
        expect(validarProducto({ ...valido, stockMinimo: '2.5' }).stockMinimo).toBeDefined()
        expect(validarProducto({ ...valido, stockMinimo: '' }).stockMinimo).toBeDefined()
        expect(validarProducto({ ...valido, stockMinimo: '1000001' }).stockMinimo).toBeDefined()
    })

    it('exige elegir una categoría', () => {
        expect(validarProducto({ ...valido, categoriaId: '' }).categoriaId).toBe('Elige una categoría.')
    })
})