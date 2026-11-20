import type { MetodoPago } from '../api/ventas'

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
    { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
    { valor: 'TARJETA', etiqueta: 'Tarjeta' },
    { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
]

export function etiquetaMetodo(metodo: MetodoPago | null | undefined): string {
    return METODOS_PAGO.find((m) => m.valor === metodo)?.etiqueta ?? '—'
}