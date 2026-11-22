import type { EstadoVenta, MetodoPago } from '../api/ventas'
import { enteroPositivo } from './parametrosUrl'

export interface FiltrosVentas {
    desde: string
    hasta: string
    pagina: number
    estado: EstadoVenta | ''
    metodo: MetodoPago | ''
    empleado: string
}

const ESTADOS: EstadoVenta[] = ['COMPLETADA', 'ANULADA']
const METODOS: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']

/** AAAA-MM-DD que existe de verdad en el calendario (rechaza, por ejemplo, 2026-02-30). */
export function esFechaValida(texto: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
    const fecha = new Date(`${texto}T00:00:00Z`)
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto
}

/** Lee los filtros de la dirección. Todo valor inválido se ignora y vuelve a su valor por defecto. */
export function leerFiltrosVentas(params: URLSearchParams, hoy: string): FiltrosVentas {
    const fecha = (clave: string) => {
    const valor = params.get(clave)
    return valor !== null && esFechaValida(valor) ? valor : hoy
    }
    const estado = params.get('estado')
    const pago = params.get('pago')
    return {
        desde: fecha('desde'),
        hasta: fecha('hasta'),
        pagina: enteroPositivo(params.get('pagina')),
        estado: ESTADOS.find((e) => e === estado) ?? '',
        metodo: METODOS.find((m) => m === pago) ?? '',
        empleado: params.get('empleado') ?? '',
    }
    }

    /** Texto de consulta para `GET /ventas/`; los filtros vacíos no se envían. */
    export function consultaVentas(filtros: FiltrosVentas, tamanio: number): string {
    const consulta = new URLSearchParams({
        fecha_inicio: filtros.desde,
        fecha_fin: filtros.hasta,
        pagina: String(filtros.pagina),
        tamanio: String(tamanio),
    })
    if (filtros.estado) consulta.set('estado', filtros.estado)
    if (filtros.metodo) consulta.set('metodo_pago', filtros.metodo)
    if (filtros.empleado) consulta.set('empleado', filtros.empleado)
    return consulta.toString()
    }

    /** ¿Hay algún filtro aparte de las fechas? */
    export function hayFiltrosExtra(filtros: FiltrosVentas): boolean {
    return filtros.estado !== '' || filtros.metodo !== '' || filtros.empleado !== ''
}