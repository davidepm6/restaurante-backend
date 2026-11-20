import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from './client'

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'

export interface ItemVenta {
    producto_id: number
    cantidad: number
}

export interface DetalleVenta {
    producto_id: number
    nombre_producto: string
    cantidad: number
    precio_unitario: number
    subtotal: number
}

export interface Venta {
    id: number
    fecha: string
    total: number
    metodo_pago: MetodoPago | null
    detalles: DetalleVenta[]
}

export interface NuevaVenta {
    items: ItemVenta[]
    metodo_pago: MetodoPago
}

export function useRegistrarVenta() {
    const api = useApi()
    const cliente = useQueryClient()
    return useMutation({
        mutationFn: (venta: NuevaVenta) => api<Venta>('/ventas/', { method: 'POST', body: JSON.stringify(venta) }),
        // El stock cambia si la venta sale bien, y también conviene refrescarlo si falla
        // (otro cajero pudo vender antes que tú).
        onSettled: () => cliente.invalidateQueries({ queryKey: ['productos'] }),
    })
}