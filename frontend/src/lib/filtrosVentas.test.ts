import { describe, expect, it } from 'vitest'
import { consultaVentas, esFechaValida, hayFiltrosExtra, leerFiltrosVentas } from './filtrosVentas'

const HOY = '2026-11-21'
const leer = (texto: string) => leerFiltrosVentas(new URLSearchParams(texto), HOY)

describe('esFechaValida', () => {
    it('acepta fechas reales, incluido el 29 de febrero de un año bisiesto', () => {
        expect(esFechaValida('2026-11-20')).toBe(true)
        expect(esFechaValida('2028-02-29')).toBe(true)
    })

    it('rechaza fechas imposibles o mal escritas', () => {
        for (const mala of ['2026-02-30', '2026-02-29', '2026-13-01', '2026-00-10', 'ayer', '2026-1-5', '']) {
        expect(esFechaValida(mala)).toBe(false)
        }
    })
    })

    describe('leerFiltrosVentas', () => {
    it('sin parámetros usa hoy, la primera página y ningún filtro', () => {
        expect(leer('')).toEqual({ desde: HOY, hasta: HOY, pagina: 1, estado: '', metodo: '', empleado: '' })
    })

    it('lee todos los valores válidos', () => {
        expect(leer('desde=2026-11-01&hasta=2026-11-20&pagina=3&estado=ANULADA&pago=TARJETA&empleado=user_abc')).toEqual({
        desde: '2026-11-01',
        hasta: '2026-11-20',
        pagina: 3,
        estado: 'ANULADA',
        metodo: 'TARJETA',
        empleado: 'user_abc',
        })
    })

    it('ignora los valores inválidos', () => {
        const f = leer('desde=2026-02-30&hasta=ayer&pagina=x&estado=OTRO&pago=CHEQUE')
        expect(f).toEqual({ desde: HOY, hasta: HOY, pagina: 1, estado: '', metodo: '', empleado: '' })
    })

    it('una fecha válida y otra inválida: solo se descarta la inválida', () => {
        const f = leer('desde=2026-11-01&hasta=2026-99-99')
        expect(f.desde).toBe('2026-11-01')
        expect(f.hasta).toBe(HOY)
    })
    })

    describe('consultaVentas', () => {
    it('sin filtros envía solo fechas, página y tamaño', () => {
        expect(consultaVentas(leer(''), 25)).toBe(
        `fecha_inicio=${HOY}&fecha_fin=${HOY}&pagina=1&tamanio=25`,
        )
    })

    it('con todos los filtros usa los nombres que espera la API', () => {
        const f = leer('desde=2026-11-01&hasta=2026-11-20&pagina=2&estado=COMPLETADA&pago=EFECTIVO&empleado=user_abc')
        expect(consultaVentas(f, 25)).toBe(
        'fecha_inicio=2026-11-01&fecha_fin=2026-11-20&pagina=2&tamanio=25&estado=COMPLETADA&metodo_pago=EFECTIVO&empleado=user_abc',
        )
    })

    it('codifica los caracteres especiales del identificador', () => {
        expect(consultaVentas(leer('empleado=a%26b%20c'), 25)).toContain('empleado=a%26b+c')
    })
    })

    describe('hayFiltrosExtra', () => {
    it('las fechas y la página no cuentan como filtros', () => {
        expect(hayFiltrosExtra(leer('desde=2026-11-01&pagina=3'))).toBe(false)
    })

    it('el estado, el método o el empleado sí', () => {
        expect(hayFiltrosExtra(leer('estado=ANULADA'))).toBe(true)
        expect(hayFiltrosExtra(leer('pago=TARJETA'))).toBe(true)
        expect(hayFiltrosExtra(leer('empleado=user_abc'))).toBe(true)
    })
})