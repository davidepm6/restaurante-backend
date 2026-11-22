import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboard } from '../api/dashboard'
import Dashboard from './Dashboard'

vi.mock('../api/dashboard', () => ({ useDashboard: vi.fn() }))

// El dibujo del gráfico se prueba aparte; aquí solo importa que reciba los datos.
vi.mock('../components/dashboard/GraficoVentasDia', async () => {
    const React = await import('react')
    return {
        GraficoVentasDia: ({ datos }: { datos: unknown[] }) => React.createElement('p', null, `Gráfico de ${datos.length} días`),
    }
    })

    const SERIE = Array.from({ length: 14 }, (_, i) => ({ fecha: `2026-11-${String(8 + i).padStart(2, '0')}`, ventas: 1, total: 1000 }))

    const DATOS = {
    hoy: '2026-11-21',
    dia: { desde: '2026-11-21', hasta: '2026-11-21', ventas: 4, ingresos: 120000, egresos: 20000, balance: 100000 },
    mes: { desde: '2026-11-01', hasta: '2026-11-21', ventas: 80, ingresos: 2400000, egresos: 3000000, balance: -600000 },
    ventas_por_dia: SERIE,
    por_metodo_pago: [
        { metodo: 'EFECTIVO', ventas: 50, total: 1500000 },
        { metodo: 'TARJETA', ventas: 25, total: 800000 },
        { metodo: 'SIN_METODO', ventas: 5, total: 100000 },
    ],
    mas_vendidos: [
        { producto_id: 1, producto: 'Hamburguesa clásica', cantidad: 120, total: 2640000 },
        { producto_id: 2, producto: 'Limonada natural', cantidad: 90, total: 540000 },
    ],
    stock_bajo: {
        cantidad: 7,
        productos: [
        { id: 3, nombre: 'Brownie', stock: 0, stock_minimo: 5 },
        { id: 4, nombre: 'Arepa', stock: 2, stock_minimo: 10 },
        ],
    },
    }

    const refetch = vi.fn()

    function montar(estado: Record<string, unknown> = {}) {
    vi.mocked(useDashboard).mockReturnValue({
        data: DATOS, error: null, isPending: false, isFetching: false, refetch, ...estado,
    } as unknown as ReturnType<typeof useDashboard>)
    render(
        <MemoryRouter>
        <Dashboard />
        </MemoryRouter>,
    )
    return { user: userEvent.setup() }
    }

    /** El valor de una tarjeta: va justo después de su etiqueta. */
    const valorDe = (seccion: HTMLElement, etiqueta: string) => within(seccion).getByText(etiqueta).nextSibling

    describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('muestra los indicadores de hoy', () => {
        montar()
        const hoy = screen.getByRole('region', { name: 'Hoy' })
        expect(valorDe(hoy, 'Ventas')).toHaveTextContent('4')
        expect(valorDe(hoy, 'Ingresos')).toHaveTextContent(/120\.000/)
        expect(valorDe(hoy, 'Egresos')).toHaveTextContent(/20\.000/)
        expect(valorDe(hoy, 'Balance')).toHaveTextContent(/100\.000/)
        expect(within(hoy).getByText('21 nov')).toBeInTheDocument()
    })

    it('muestra los indicadores del mes, con el balance negativo cuando los egresos superan a los ingresos', () => {
        montar()
        const mes = screen.getByRole('region', { name: 'Este mes' })
        expect(within(mes).getByText(/Noviembre 2026/)).toBeInTheDocument()
        expect(valorDe(mes, 'Ventas')).toHaveTextContent('80')
        expect(valorDe(mes, 'Balance')).toHaveTextContent(/600\.000/)
        expect(valorDe(mes, 'Balance')).toHaveTextContent(/-/)
    })

    it('lista los métodos de pago con su porcentaje, incluido el de las ventas antiguas', () => {
        montar()
        const panel = within(screen.getByRole('region', { name: 'Por método de pago' }))
        expect(panel.getByText('Efectivo')).toBeInTheDocument()
        expect(panel.getByText(/\(63 %\)/)).toBeInTheDocument() // 1.500.000 de 2.400.000
        expect(panel.getByText('Sin método (ventas antiguas)')).toBeInTheDocument()
    })

    it('lista los productos más vendidos con sus unidades', () => {
        montar()
        const panel = within(screen.getByRole('region', { name: 'Más vendidos' }))
        expect(panel.getByText('Hamburguesa clásica')).toBeInTheDocument()
        expect(panel.getByText(/120 unidades/)).toBeInTheDocument()
    })

    it('el stock bajo muestra la cantidad, los más urgentes y un enlace al catálogo filtrado', () => {
        montar()
        const panel = within(screen.getByRole('region', { name: 'Stock bajo' }))
        expect(panel.getByText(/7 producto\(s\) por debajo de su mínimo/)).toBeInTheDocument()
        expect(panel.getByText('Brownie')).toBeInTheDocument()
        expect(panel.getByText('2 de 10')).toBeInTheDocument()
        expect(panel.getByRole('link', { name: 'Ver todos en el catálogo' })).toHaveAttribute('href', '/productos?bajo=1')
    })

    it('sin productos bajo su mínimo lo dice y no ofrece el enlace', () => {
        montar({ data: { ...DATOS, stock_bajo: { cantidad: 0, productos: [] } } })
        const panel = within(screen.getByRole('region', { name: 'Stock bajo' }))
        expect(panel.getByText('Ningún producto está por debajo de su mínimo.')).toBeInTheDocument()
        expect(panel.queryByRole('link')).not.toBeInTheDocument()
    })

    it('sin ventas en el mes explica que aún no hay datos', () => {
        montar({ data: { ...DATOS, por_metodo_pago: [], mas_vendidos: [] } })
        expect(screen.getAllByText('Aún no hay ventas este mes.')).toHaveLength(2)
    })

    it('el gráfico empieza con 14 días y se puede cambiar el rango', async () => {
        const { user } = montar()
        expect(vi.mocked(useDashboard)).toHaveBeenLastCalledWith(14)
        expect(screen.getByText('Gráfico de 14 días')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '14 días' })).toHaveAttribute('aria-pressed', 'true')

        await user.click(screen.getByRole('button', { name: '30 días' }))

        expect(vi.mocked(useDashboard)).toHaveBeenLastCalledWith(30)
        expect(screen.getByRole('button', { name: '30 días' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('el botón Actualizar vuelve a pedir los datos', async () => {
        const { user } = montar()
        await user.click(screen.getByRole('button', { name: 'Actualizar' }))
        expect(refetch).toHaveBeenCalled()
    })

    it('mientras carga por primera vez lo indica', () => {
        montar({ data: undefined, isPending: true })
        expect(screen.getByText('Cargando indicadores…')).toBeInTheDocument()
        expect(screen.queryByRole('region', { name: 'Hoy' })).not.toBeInTheDocument()
    })

    it('si falla la primera carga muestra el error y permite reintentar', async () => {
        const { user } = montar({ data: undefined, error: new Error('Servidor caído') })
        expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los indicadores: Servidor caído')

        await user.click(screen.getByRole('button', { name: 'Reintentar' }))
        expect(refetch).toHaveBeenCalled()
    })

    it('si falla una actualización conserva los datos que ya tenía', () => {
        montar({ error: new Error('Sin conexión') })
        expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron actualizar los indicadores')
        expect(screen.getByRole('region', { name: 'Hoy' })).toBeInTheDocument()
    })
})