import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './client'

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
export type EstadoVenta = 'COMPLETADA' | 'ANULADA'

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
    estado: EstadoVenta
    registrada_por_nombre: string | null
    anulada_en: string | null
    anulada_por_nombre: string | null
    motivo_anulacion: string | null
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
        onSettled: () => {
        cliente.invalidateQueries({ queryKey: ['productos'] })
        cliente.invalidateQueries({ queryKey: ['ventas'] })
        },
    })
}

export function useVentas(desde: string, hasta: string, habilitado: boolean) {
    const api = useApi()
    return useQuery({
        queryKey: ['ventas', desde, hasta],
        queryFn: () => api<Venta[]>(`/ventas/?fecha_inicio=${desde}&fecha_fin=${hasta}`),
        enabled: habilitado,
    })
}

export function useAnularVenta() {
    const api = useApi()
    const cliente = useQueryClient()
    return useMutation({
        mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
        api<Venta>(`/ventas/${id}/anular`, { method: 'POST', body: JSON.stringify({ motivo }) }),
        // Se refresca la lista y el stock, que vuelve al inventario. También si falla (p. ej. ya estaba anulada).
        onSettled: () => {
        cliente.invalidateQueries({ queryKey: ['ventas'] })
        cliente.invalidateQueries({ queryKey: ['productos'] })
        },
    })
}