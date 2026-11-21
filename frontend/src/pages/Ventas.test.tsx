import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnularVenta, useVentas } from '../api/ventas'
import { ToastProvider } from '../components/ui/ToastProvider'
import Ventas from './Ventas'

vi.mock('../api/ventas', () => ({ useVentas: vi.fn(), useAnularVenta: vi.fn() }))

const detalle = (nombre: string, cantidad: number) => ({
  producto_id: 1, nombre_producto: nombre, cantidad, precio_unitario: 1000, subtotal: 1000 * cantidad,
})

const BASE = {
    fecha: '2026-11-20T15:00:00Z',
    metodo_pago: 'EFECTIVO',
    anulada_en: null,
    anulada_por_nombre: null,
    motivo_anulacion: null,
    }

    const VENTAS = [
    { ...BASE, id: 1, total: 20000, estado: 'COMPLETADA', registrada_por_nombre: 'Ana Pérez', metodo_pago: 'TARJETA', detalles: [detalle('Hamburguesa clásica', 2)] },
    { ...BASE, id: 2, total: 6000, estado: 'COMPLETADA', registrada_por_nombre: 'Luis Gómez', detalles: [detalle('Limonada natural', 1)] },
    {
        ...BASE, id: 3, total: 50000, estado: 'ANULADA', registrada_por_nombre: 'Ana Pérez',
        anulada_por_nombre: 'Admin', motivo_anulacion: 'Producto equivocado', detalles: [detalle('Bandeja paisa', 1)],
    },
    ]

    const anular = vi.fn()

    function montar() {
    vi.mocked(useVentas).mockReturnValue({
        data: VENTAS, isPending: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useVentas>)
    vi.mocked(useAnularVenta).mockReturnValue({
        mutate: anular, isPending: false,
    } as unknown as ReturnType<typeof useAnularVenta>)

    render(
        <ToastProvider>
        <Ventas />
        </ToastProvider>,
    )
    return { user: userEvent.setup() }
    }

    describe('Ventas', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('muestra cada venta con empleado, método, productos y estado', () => {
        montar()
        const tabla = within(screen.getByRole('table'))
        expect(tabla.getByText('#1')).toBeInTheDocument()
        expect(tabla.getAllByText('Ana Pérez')).toHaveLength(2)
        expect(tabla.getByText('Tarjeta')).toBeInTheDocument()
        expect(tabla.getByText(/2× Hamburguesa clásica/)).toBeInTheDocument()
        expect(tabla.getAllByText('Completada')).toHaveLength(2)
    })

    it('el resumen no cuenta las ventas anuladas', () => {
        montar()
        const resumen = within(screen.getByRole('region', { name: 'Resumen del período' }))
        expect(resumen.getByText(/26\.000/)).toBeInTheDocument()
        expect(resumen.getByText('Ventas completadas').nextSibling).toHaveTextContent('2')
        expect(resumen.getByText('Anuladas').nextSibling).toHaveTextContent('1')
    })

    it('las ventas anuladas muestran el motivo y no se pueden anular otra vez', () => {
        montar()
        expect(screen.getByText(/Producto equivocado/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Anular venta 1' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Anular venta 2' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Anular venta 3' })).not.toBeInTheDocument()
    })

    it('para anular se exige el motivo y no se envía nada sin él', async () => {
        const { user } = montar()
        await user.click(screen.getByRole('button', { name: 'Anular venta 1' }))
        expect(screen.getByRole('dialog', { name: 'Anular venta #1' })).toBeInTheDocument()
        expect(screen.getByText(/2× Hamburguesa clásica/, { selector: 'strong' })).toBeInTheDocument()

        fireEvent.submit(document.getElementById('form-anulacion')!)
        expect(await screen.findByText(/Escribe el motivo de la anulación/)).toBeInTheDocument()
        expect(anular).not.toHaveBeenCalled()
    })

    it('con un motivo válido envía la anulación con el motivo sin espacios sobrantes', async () => {
        const { user } = montar()
        await user.click(screen.getByRole('button', { name: 'Anular venta 1' }))
        await user.type(screen.getByLabelText('Motivo de la anulación'), '  Error de digitación  ')
        fireEvent.submit(document.getElementById('form-anulacion')!)

        expect(anular).toHaveBeenCalledWith({ id: 1, motivo: 'Error de digitación' }, expect.anything())
    })

    it('un rango con la fecha final anterior muestra el error y no consulta', () => {
        montar()
        fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-20' } })
        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-10' } })

        expect(screen.getByRole('alert')).toHaveTextContent('La fecha final no puede ser anterior a la inicial.')
        expect(useVentas).toHaveBeenLastCalledWith('2026-11-20', '2026-11-10', false)
    })
})