import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './client'

export type Rol = 'ADMINISTRADOR' | 'EMPLEADO'

export interface Empleado {
    id: string
    nombre: string
    email: string | null
    rol: Rol | null
    activo: boolean
    ultimo_acceso: string | null
    es_actual: boolean
}

export interface Invitacion {
    id: string
    email: string
    rol: Rol | null
    creada_en: string | null
}

export interface EmpleadosRespuesta {
    usuarios: Empleado[]
    invitaciones: Invitacion[]
}

const CLAVE = ['empleados']

export function useEmpleados() {
    const api = useApi()
    return useQuery({ queryKey: CLAVE, queryFn: () => api<EmpleadosRespuesta>('/admin/empleados/') })
}

function useRefrescar() {
    const cliente = useQueryClient()
    return () => cliente.invalidateQueries({ queryKey: CLAVE })
}

export function useInvitarEmpleado() {
    const api = useApi()
    const refrescar = useRefrescar()
    return useMutation({
        mutationFn: (datos: { email: string; rol: Rol }) =>
        api<Invitacion>('/admin/empleados/invitaciones', { method: 'POST', body: JSON.stringify(datos) }),
        onSuccess: refrescar,
    })
}

export function useCambiarRol() {
    const api = useApi()
    const refrescar = useRefrescar()
    return useMutation({
        mutationFn: ({ id, rol }: { id: string; rol: Rol }) =>
        api<Empleado>(`/admin/empleados/${id}/rol`, { method: 'PUT', body: JSON.stringify({ rol }) }),
        onSuccess: refrescar,
    })
}

export function useCambiarEstado() {
    const api = useApi()
    const refrescar = useRefrescar()
    return useMutation({
        mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
        api<Empleado>(`/admin/empleados/${id}/estado`, { method: 'PUT', body: JSON.stringify({ activo }) }),
        onSuccess: refrescar,
    })
}

export function useRevocarInvitacion() {
    const api = useApi()
    const refrescar = useRefrescar()
    return useMutation({
        mutationFn: (id: string) => api<void>(`/admin/empleados/invitaciones/${id}`, { method: 'DELETE' }),
        onSuccess: refrescar,
    })
}