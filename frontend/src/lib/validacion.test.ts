import { describe, expect, it } from 'vitest'
import { hayErrores, validarCategoria } from './validacion'

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