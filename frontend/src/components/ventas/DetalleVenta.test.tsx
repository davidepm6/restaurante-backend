import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Venta } from '../../api/ventas'
import { ErrorDescarga } from '../../lib/descarga'
import { ToastProvider } from '../ui/ToastProvider'
import { DetalleVenta } from './DetalleVenta'

const { descargarArchivo } = vi.hoisted(() => ({ descargarArchivo: vi.fn() }))
vi.mock('../../api/descargas', () => ({ useDescargarArchivo: () => descargarArchivo }))

const linea = (nombre: string, cantidad: number, precio: number) => ({
  producto_id: 1, nombre_producto: nombre, cantidad, precio_unitario: precio, subtotal: cantidad * precio,
})

const COMPLETADA: Venta = {
    id: 7,
    fecha: '2026-11-20T23:15:00Z',
    total: 34000,
    metodo_pago: 'TARJETA',
    estado: 'COMPLETADA',
    registrada_por_nombre: 'Ana Pérez',
    anulada_en: null,
    anulada_por_nombre: null,
    motivo_anulacion: null,
    detalles: [linea('Limonada natural', 2, 6000), linea('Hamburguesa clásica', 1, 22000)],
    }

    const ANULADA: Venta = {
    ...COMPLETADA,
    id: 8,
    estado: 'ANULADA',
    anulada_en: '2026-11-21T15:00:00Z',
    anulada_por_nombre: 'Admin',
    motivo_anulacion: 'Producto equivocado',
    }

    function montar(venta: Venta, onCerrar = vi.fn()) {
    render(
        <ToastProvider>
        <DetalleVenta venta={venta} onCerrar={onCerrar} />
        </ToastProvider>,
    )
    return { user: userEvent.setup(), onCerrar, dialogo: within(screen.getByRole('dialog', { name: `Venta #${venta.id}` })) }
    }

    describe('DetalleVenta', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        descargarArchivo.mockResolvedValue(undefined)
    })

    it('muestra los datos de la venta, sus productos y el total', () => {
        const { dialogo } = montar(COMPLETADA)
        expect(dialogo.getByText('Ana Pérez')).toBeInTheDocument()
        expect(dialogo.getByText('Tarjeta')).toBeInTheDocument()
        expect(dialogo.getByText('Completada')).toBeInTheDocument()
        expect(dialogo.getByText('Limonada natural')).toBeInTheDocument()
        expect(dialogo.getByText('Hamburguesa clásica')).toBeInTheDocument()
        expect(dialogo.getByText(/12\.000/)).toBeInTheDocument() // subtotal de la limonada
        expect(dialogo.getByText(/34\.000/)).toBeInTheDocument() // total
    })

    it('una venta anulada muestra el motivo y quién la anuló', () => {
        const { dialogo } = montar(ANULADA)
        expect(dialogo.getByText(/Motivo: Producto equivocado/)).toBeInTheDocument()
        expect(dialogo.getByText(/por Admin/)).toBeInTheDocument()
    })

    it('una venta completada no muestra aviso de anulación', () => {
        const { dialogo } = montar(COMPLETADA)
        expect(dialogo.queryByText(/Motivo:/)).not.toBeInTheDocument()
    })

    it('descarga el comprobante de esa venta', async () => {
        const { user, dialogo } = montar(COMPLETADA)
        await user.click(dialogo.getByRole('button', { name: 'Descargar comprobante' }))
        expect(descargarArchivo).toHaveBeenCalledWith('/ventas/7/comprobante', 'comprobante-7.pdf')
    })

    it('si la descarga falla muestra el motivo en un aviso', async () => {
        descargarArchivo.mockRejectedValue(new ErrorDescarga('Venta no encontrada', 404))
        const { user, dialogo } = montar(COMPLETADA)
        await user.click(dialogo.getByRole('button', { name: 'Descargar comprobante' }))
        expect(await screen.findByText('Venta no encontrada')).toBeInTheDocument()
    })

    it('el botón Cerrar avisa para cerrar el diálogo', async () => {
        const { user, dialogo, onCerrar } = montar(COMPLETADA)
        await user.click(dialogo.getByRole('button', { name: 'Cerrar' }))
        expect(onCerrar).toHaveBeenCalled()
    })
})