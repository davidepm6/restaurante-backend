import { diasEntre } from './fechas'

export const MAXIMO_DIAS_RANGO = 62

/** Devuelve el mensaje de error del rango, o null si es válido. */
export function validarRango(desde: string, hasta: string): string | null {
    if (!desde || !hasta) return 'Elige las dos fechas.'
    if (hasta < desde) return 'La fecha final no puede ser anterior a la inicial.'
    if (diasEntre(desde, hasta) + 1 > MAXIMO_DIAS_RANGO) {
        return `Elige un rango de máximo ${MAXIMO_DIAS_RANGO} días.`
    }
    return null
}