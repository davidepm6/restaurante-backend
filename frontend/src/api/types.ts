import type { Rol } from './empleados'

export interface Me {
    clerk_user_id: string
    role: Rol | null
}