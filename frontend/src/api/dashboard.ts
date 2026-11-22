import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useApi } from './client'

export interface Periodo {
    desde: string
    hasta: string
    ventas: number
    ingresos: number
    egresos: number
    balance: number
    }

    export interface VentaDia {
    fecha: string
    ventas: number
    total: number
    }

    export interface VentaMetodo {
    metodo: string
    ventas: number
    total: number
    }

    export interface ProductoVendido {
    producto_id: number
    producto: string
    cantidad: number
    total: number
    }

    export interface ProductoStockBajo {
    id: number
    nombre: string
    stock: number
    stock_minimo: number
    }

    export interface Dashboard {
    hoy: string
    dia: Periodo
    mes: Periodo
    ventas_por_dia: VentaDia[]
    por_metodo_pago: VentaMetodo[]
    mas_vendidos: ProductoVendido[]
    stock_bajo: { cantidad: number; productos: ProductoStockBajo[] }
    }

    /** `dias` es la cantidad de días del gráfico de ventas, terminando hoy (entre 7 y 31). */
    export function useDashboard(dias: number) {
    const api = useApi()
    return useQuery({
        queryKey: ['dashboard', dias],
        queryFn: () => api<Dashboard>(`/dashboard?dias=${dias}`),
        // Al cambiar de rango se sigue mostrando lo anterior mientras llega lo nuevo (sin parpadeo).
        placeholderData: keepPreviousData,
    })
}