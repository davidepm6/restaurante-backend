import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from './client'

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
    detalles: DetalleVenta[]
}

export function useRegistrarVenta() {
    const api = useApi()
    const cliente = useQueryClient()
    return useMutation({
        mutationFn: (items: ItemVenta[]) =>
        api<Venta>('/ventas/', { method: 'POST', body: JSON.stringify({ items }) }),
        // El stock cambia si la venta sale bien, y también conviene refrescarlo si falla
        // (otro cajero pudo vender antes que tú).
        onSettled: () => cliente.invalidateQueries({ queryKey: ['productos'] }),
    })
}