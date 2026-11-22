import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorDescarga, guardarArchivo, mensajeDescarga, nombreComprobante } from './descarga'

describe('nombreComprobante', () => {
    it('usa el número de la venta', () => {
        expect(nombreComprobante(7)).toBe('comprobante-7.pdf')
    })
    })

    describe('mensajeDescarga', () => {
    it('muestra el mensaje del servidor', () => {
        expect(mensajeDescarga(new ErrorDescarga('Venta no encontrada', 404))).toBe('Venta no encontrada')
    })

    it('explica un fallo de red', () => {
        expect(mensajeDescarga(new TypeError('Failed to fetch'))).toMatch(/No se pudo conectar con el servidor/)
    })

    it('con cualquier otro error usa un mensaje genérico', () => {
        expect(mensajeDescarga(new Error('raro'))).toBe('No se pudo descargar el archivo.')
        expect(mensajeDescarga('texto')).toBe('No se pudo descargar el archivo.')
    })
    })

    describe('guardarArchivo', () => {
    const crear = vi.fn(() => 'blob:prueba')
    const liberar = vi.fn()
    let clic: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.useFakeTimers()
        Object.assign(URL, { createObjectURL: crear, revokeObjectURL: liberar })
        clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
        crear.mockClear()
        liberar.mockClear()
    })

    it('descarga el archivo con el nombre indicado y no deja enlaces sobrantes', () => {
        const nombres: string[] = []
        clic.mockImplementation(function (this: HTMLAnchorElement) {
        nombres.push(this.download)
        })

        guardarArchivo(new Blob(['x']), 'comprobante-7.pdf')

        expect(nombres).toEqual(['comprobante-7.pdf'])
        expect(document.querySelectorAll('a[download]')).toHaveLength(0)
    })

    it('libera la dirección temporal después de unos segundos, no antes', () => {
        guardarArchivo(new Blob(['x']), 'a.pdf')
        expect(liberar).not.toHaveBeenCalled()

        vi.advanceTimersByTime(10_000)
        expect(liberar).toHaveBeenCalledWith('blob:prueba')
    })
})