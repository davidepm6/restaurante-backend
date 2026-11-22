import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consultaVentas, type FiltrosVentas } from '../lib/filtrosVentas'
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

/** Totales de todo lo que cumple los filtros (los calcula el servidor), no solo de la página visible. */
export interface ResumenVentas {
  total_vendido: number
  completadas: number
  anuladas: number
}

export interface PaginaVentas {
  items: Venta[]
  total: number
  pagina: number
  tamanio: number
  paginas: number
  resumen: ResumenVentas
}

export interface EmpleadoVentas {
  id: string
  nombre: string | null
}

export const TAMANIO_PAGINA = 25

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
      cliente.invalidateQueries({ queryKey: ['empleados-ventas'] })
    },
  })
}

export function useVentas(filtros: FiltrosVentas, habilitado: boolean) {
  const api = useApi()
  const consulta = consultaVentas(filtros, TAMANIO_PAGINA)
  return useQuery({
    queryKey: ['ventas', consulta],
    queryFn: () => api<PaginaVentas>(`/ventas/?${consulta}`),
    enabled: habilitado,
    // Al cambiar de página o de filtro se sigue mostrando lo anterior mientras llega lo nuevo (sin parpadeo).
    placeholderData: keepPreviousData,
  })
}

/** Quienes han registrado ventas, para el filtro de empleado. */
export function useEmpleadosVentas() {
  const api = useApi()
  return useQuery({
    queryKey: ['empleados-ventas'],
    queryFn: () => api<EmpleadoVentas[]>('/ventas/empleados'),
    staleTime: 60_000,
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