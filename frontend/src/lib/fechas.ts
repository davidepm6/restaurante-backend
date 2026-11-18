/** Fecha (AAAA-MM-DD) en Colombia para un instante dado. Por defecto, ahora. */
export function fechaColombia(instante: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(instante)
}