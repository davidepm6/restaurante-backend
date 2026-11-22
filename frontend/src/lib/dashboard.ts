import type { VentaDia } from '../api/dashboard'
import { etiquetaMetodo } from './pago'
import type { MetodoPago } from '../api/ventas'

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ]

    /** «2026-11-21» → «21 nov». No usa zonas horarias: es solo texto. */
    export function formatoDiaCorto(fecha: string): string {
    const [, mes, dia] = fecha.split('-').map(Number)
    return `${dia} ${MESES_CORTOS[mes - 1]}`
    }

    /** «2026-11-21» → «Noviembre 2026». */
    export function nombreMes(fecha: string): string {
    const [anio, mes] = fecha.split('-').map(Number)
    const nombre = MESES[mes - 1]
    return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`
    }

    /** Parte de `valor` sobre `total`, de 0 a 100, redondeada. Con un total de cero o menos es 0. */
    export function porcentaje(valor: number, total: number): number {
    if (total <= 0) return 0
    return Math.min(100, Math.max(0, Math.round((valor / total) * 100)))
    }

    /** Los códigos de método de pago del panel: los tres de siempre más «SIN_METODO» (ventas anteriores a HU43). */
    export function etiquetaMetodoPanel(codigo: string): string {
    if (codigo === 'SIN_METODO') return 'Sin método (ventas antiguas)'
    return etiquetaMetodo(codigo as MetodoPago)
    }

    export function hayVentas(serie: VentaDia[]): boolean {
    return serie.some((d) => d.total > 0)
    }

    /** Montos cortos para el eje del gráfico: 12000 → «12 mil», 1500000 → «1,5 M». */
    export function abreviarMonto(valor: number): string {
    if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} M`
    if (valor >= 1_000) return `${Math.round(valor / 1_000)} mil`
    return String(valor)
}