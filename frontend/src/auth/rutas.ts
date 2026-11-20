import type { Rol } from '../api/empleados'

export interface RutaApp {
    ruta: string
    etiqueta: string
    /** 'cualquiera' = todo usuario autenticado, incluso sin rol asignado (la pantalla de inicio). */
    roles: Rol[] | 'cualquiera'
    end?: boolean
}

const ADMIN: Rol[] = ['ADMINISTRADOR']
const TODOS: Rol[] = ['ADMINISTRADOR', 'EMPLEADO']

export const RUTAS: RutaApp[] = [
    { ruta: '/', etiqueta: 'Inicio', roles: 'cualquiera', end: true },
    { ruta: '/punto-de-venta', etiqueta: 'Punto de venta', roles: TODOS },
    { ruta: '/categorias', etiqueta: 'Categorías', roles: ADMIN },
    { ruta: '/productos', etiqueta: 'Productos', roles: TODOS },
    { ruta: '/empleados', etiqueta: 'Empleados', roles: ADMIN },
    ...(import.meta.env.DEV ? [{ ruta: '/muestrario', etiqueta: 'Muestrario', roles: ADMIN }] : []),
]

export function puedeVer(ruta: RutaApp, rol: Rol | null | undefined): boolean {
    if (ruta.roles === 'cualquiera') return true
    return rol != null && ruta.roles.includes(rol)
}

export function rutasVisibles(rol: Rol | null | undefined): RutaApp[] {
    return RUTAS.filter((r) => puedeVer(r, rol))
}