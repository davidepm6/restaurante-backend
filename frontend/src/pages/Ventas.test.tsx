import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnularVenta, useEmpleadosVentas, useVentas } from '../api/ventas'
import { ToastProvider } from '../components/ui/ToastProvider'
import Ventas from './Ventas'

vi.mock('../api/ventas', () => ({
    TAMANIO_PAGINA: 25,
    useVentas: vi.fn(),
    useAnularVenta: vi.fn(),
    useEmpleadosVentas: vi.fn(),
}))

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

    const EMPLEADOS = [
    { id: 'user_ana', nombre: 'Ana Pérez' },
    { id: 'user_luis', nombre: 'Luis Gómez' },
    ]

    function pagina(sobrescribir: Record<string, unknown> = {}) {
    return {
        items: VENTAS,
        total: 3,
        pagina: 1,
        tamanio: 25,
        paginas: 1,
        // Los totales los manda el servidor: a propósito NO coinciden con la suma de las filas visibles.
        resumen: { total_vendido: 900000, completadas: 40, anuladas: 7 },
        ...sobrescribir,
    }
    }

    const anular = vi.fn()

    function montar(datos = pagina(), url = '/ventas') {
    vi.mocked(useVentas).mockReturnValue({
        data: datos, isPending: false, isPlaceholderData: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useVentas>)
    vi.mocked(useEmpleadosVentas).mockReturnValue({
        data: EMPLEADOS,
    } as unknown as ReturnType<typeof useEmpleadosVentas>)
    vi.mocked(useAnularVenta).mockReturnValue({
        mutate: anular, isPending: false,
    } as unknown as ReturnType<typeof useAnularVenta>)

    render(
        <MemoryRouter initialEntries={[url]}>
        <ToastProvider>
            <Ventas />
        </ToastProvider>
        </MemoryRouter>,
    )
    return { user: userEvent.setup() }
    }

    /** Los filtros con los que se llamó por última vez a la consulta de ventas. */
    const ultimaConsulta = () => vi.mocked(useVentas).mock.calls.at(-1)!

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

    it('el resumen sale del servidor y cubre todo lo filtrado, no solo las filas de la página', () => {
        montar()
        const resumen = within(screen.getByRole('region', { name: 'Resumen del período' }))
        expect(resumen.getByText(/900\.000/)).toBeInTheDocument()
        expect(resumen.getByText('Ventas completadas').nextSibling).toHaveTextContent('40')
        expect(resumen.getByText('Anuladas').nextSibling).toHaveTextContent('7')
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
        const [filtros, habilitada] = ultimaConsulta()
        expect(filtros).toMatchObject({ desde: '2026-11-20', hasta: '2026-11-10' })
        expect(habilitada).toBe(false)
    })

    describe('paginación', () => {
        it('con varias páginas muestra el paginador y pide la siguiente', async () => {
        const { user } = montar(pagina({ total: 60, paginas: 3 }))
        expect(screen.getByText('Mostrando 1–25 de 60')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Siguiente' }))
        expect(ultimaConsulta()[0]).toMatchObject({ pagina: 2 })
        })

        it('sin resultados no muestra el paginador', () => {
        montar(pagina({ items: [], total: 0, paginas: 1, resumen: { total_vendido: 0, completadas: 0, anuladas: 0 } }))
        expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
        expect(screen.getByText('No hay ventas en este período.')).toBeInTheDocument()
        })
    })

    describe('filtros', () => {
        it('al elegir un filtro lo envía a la consulta y vuelve a la primera página', async () => {
        const { user } = montar(pagina({ total: 60, paginas: 3 }), '/ventas?pagina=2')
        expect(ultimaConsulta()[0]).toMatchObject({ pagina: 2 })

        await user.selectOptions(screen.getByLabelText('Estado'), 'ANULADA')
        expect(ultimaConsulta()[0]).toMatchObject({ estado: 'ANULADA', pagina: 1 })

        await user.selectOptions(screen.getByLabelText('Método de pago'), 'TARJETA')
        expect(ultimaConsulta()[0]).toMatchObject({ estado: 'ANULADA', metodo: 'TARJETA' })

        await user.selectOptions(screen.getByLabelText('Empleado'), 'user_luis')
        expect(ultimaConsulta()[0]).toMatchObject({ estado: 'ANULADA', metodo: 'TARJETA', empleado: 'user_luis' })
        })

        it('la lista de empleados sale de las ventas registradas', () => {
        montar()
        const lista = within(screen.getByLabelText('Empleado'))
        expect(lista.getByRole('option', { name: 'Ana Pérez' })).toBeInTheDocument()
        expect(lista.getByRole('option', { name: 'Luis Gómez' })).toBeInTheDocument()
        })

        it('los filtros se leen de la dirección al entrar', () => {
        montar(pagina(), '/ventas?estado=ANULADA&pago=TARJETA&empleado=user_ana')
        expect(screen.getByLabelText('Estado')).toHaveValue('ANULADA')
        expect(screen.getByLabelText('Método de pago')).toHaveValue('TARJETA')
        expect(screen.getByLabelText('Empleado')).toHaveValue('user_ana')
        expect(ultimaConsulta()[0]).toMatchObject({ estado: 'ANULADA', metodo: 'TARJETA', empleado: 'user_ana' })
        })

        it('los valores inválidos de la dirección se ignoran', () => {
        montar(pagina(), '/ventas?estado=OTRO&pago=CHEQUE&desde=2026-02-30')
        expect(screen.getByLabelText('Estado')).toHaveValue('')
        expect(screen.getByLabelText('Método de pago')).toHaveValue('')
        expect(ultimaConsulta()[0]).toMatchObject({ estado: '', metodo: '' })
        expect(screen.queryByRole('button', { name: 'Quitar filtros' })).not.toBeInTheDocument()
        })

        it('un empleado de la dirección que aún no está en la lista se muestra igual', () => {
        montar(pagina(), '/ventas?empleado=user_desconocido')
        expect(screen.getByLabelText('Empleado')).toHaveValue('user_desconocido')
        })

        it('«Quitar filtros» solo aparece con filtros y los limpia, sin tocar las fechas', async () => {
        const { user } = montar(pagina(), '/ventas?desde=2026-11-01&hasta=2026-11-20&estado=ANULADA')
        expect(screen.getByText(/Los totales corresponden solo a las ventas que cumplen los filtros/)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Quitar filtros' }))

        expect(screen.getByLabelText('Estado')).toHaveValue('')
        expect(screen.queryByRole('button', { name: 'Quitar filtros' })).not.toBeInTheDocument()
        expect(ultimaConsulta()[0]).toMatchObject({ desde: '2026-11-01', hasta: '2026-11-20', estado: '' })
        })

        it('si los filtros no dejan resultados lo explica', () => {
        montar(pagina({ items: [], total: 0, paginas: 1, resumen: { total_vendido: 0, completadas: 0, anuladas: 0 } }), '/ventas?estado=ANULADA')
        expect(screen.getByText('Ninguna venta coincide con los filtros.')).toBeInTheDocument()
        })
    })
})