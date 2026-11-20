import { describe, expect, it } from 'vitest'
import { rutasVisibles } from './rutas'

const rutas = (rol: Parameters<typeof rutasVisibles>[0]) => rutasVisibles(rol).map((r) => r.ruta)

describe('rutasVisibles', () => {
    it('el administrador ve todas las secciones de gestión', () => {
    expect(rutas('ADMINISTRADOR')).toEqual(
        expect.arrayContaining(['/punto-de-venta', '/empleados', '/categorias', '/productos']),
    )
})

it('el empleado ve el punto de venta y los productos, pero no la gestión', () => {
    expect(rutas('EMPLEADO')).toEqual(expect.arrayContaining(['/punto-de-venta', '/productos']))
    expect(rutas('EMPLEADO')).not.toContain('/empleados')
    expect(rutas('EMPLEADO')).not.toContain('/categorias')
})

it('una cuenta sin rol solo ve el inicio', () => {
    expect(rutas(null)).toEqual(['/'])
})

it('mientras no se conoce el rol solo se ve el inicio', () => {
    expect(rutas(undefined)).toEqual(['/'])
    })
})