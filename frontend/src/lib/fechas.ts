const ZONA = 'America/Bogota'

/** Fecha (AAAA-MM-DD) en Colombia para un instante dado. Por defecto, ahora. */
export function fechaColombia(instante: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante)
}

/** Suma (o resta) días a una fecha AAAA-MM-DD. Es aritmética de calendario pura, sin zonas horarias. */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Diferencia en días entre dos fechas AAAA-MM-DD (hasta − desde). */
export function diasEntre(desde: string, hasta: string): number {
    const ms = new Date(`${hasta}T00:00:00Z`).getTime() - new Date(`${desde}T00:00:00Z`).getTime()
    return Math.round(ms / 86_400_000)
}

/** Fecha y hora legibles en hora de Colombia, p. ej. «20 nov 2026, 7:15 p. m.». */
export function formatoFechaHora(iso: string): string {
    return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    }).format(new Date(iso))
}