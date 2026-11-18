import type { ReactNode } from 'react'
import { useMe } from '../../api/me'
import type { Rol } from '../../api/empleados'
import SinAcceso from '../../pages/SinAcceso'
import { Button } from '../ui/Button'

interface RequireRoleProps {
    roles: Rol[]
    children: ReactNode
    }

export function RequireRole({ roles, children }: RequireRoleProps) {
    const { data, isPending, error, refetch } = useMe()

    if (isPending) return <p>Conectando con el servidor…</p>

    if (error || !data) {
        return (
        <div role="alert">
            <p>No se pudo verificar tu sesión.</p>
            <Button variante="ghost" onClick={() => refetch()}>Reintentar</Button>
        </div>
        )
    }

    return data.role !== null && roles.includes(data.role) ? <>{children}</> : <SinAcceso />
}