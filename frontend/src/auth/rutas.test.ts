import { describe, expect, it } from 'vitest'
import { rutasVisibles } from './rutas'

const rutas = (rol: Parameters<typeof rutasVisibles>[0]) => rutasVisibles(rol).map((r) => r.ruta)

describe('rutasVisibles', () => {
    it('el administrador ve la gestión de empleados', () => {
        expect(rutas('ADMINISTRADOR')).toContain('/empleados')
    })

    it('el empleado no ve la gestión de empleados', () => {
        expect(rutas('EMPLEADO')).not.toContain('/empleados')
    })

    it('una cuenta sin rol solo ve el inicio', () => {
        expect(rutas(null)).toEqual(['/'])
    })

    it('mientras no se conoce el rol solo se ve el inicio', () => {
        expect(rutas(undefined)).toEqual(['/'])
    })
})