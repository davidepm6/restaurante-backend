import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCategorias, useProductos } from '../api/catalogo'
import { useRegistrarVenta } from '../api/ventas'
import { ToastProvider } from '../components/ui/ToastProvider'
import PuntoDeVenta from './PuntoDeVenta'

vi.mock('../api/catalogo', () => ({ useProductos: vi.fn(), useCategorias: vi.fn() }))
vi.mock('../api/ventas', () => ({ useRegistrarVenta: vi.fn() }))
const { descargarArchivo } = vi.hoisted(() => ({ descargarArchivo: vi.fn() }))
vi.mock('../api/descargas', () => ({ useDescargarArchivo: () => descargarArchivo }))

const PRODUCTOS = [
    { id: 1, nombre: 'Limonada natural', precio: 6000, stock: 3, categoria_id: 1, activo: true, creado_en: '' },
    { id: 2, nombre: 'Hamburguesa clásica', precio: 22000, stock: 10, categoria_id: 2, activo: true, creado_en: '' },
    { id: 3, nombre: 'Brownie', precio: 12000, stock: 0, categoria_id: 3, activo: true, creado_en: '' },
    ]
    const CATEGORIAS = [{ id: 1, nombre: 'Bebidas', descripcion: null, creado_en: '' }]

    const mutar = vi.fn()

    function montar() {
    vi.mocked(useProductos).mockReturnValue({
        data: PRODUCTOS, isPending: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useProductos>)
    vi.mocked(useCategorias).mockReturnValue({
        data: CATEGORIAS, isPending: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategorias>)
    vi.mocked(useRegistrarVenta).mockReturnValue({
        mutate: mutar, isPending: false,
    } as unknown as ReturnType<typeof useRegistrarVenta>)

    render(
        <ToastProvider>
        <PuntoDeVenta />
        </ToastProvider>,
    )
    return {
        user: userEvent.setup(),
        buscador: screen.getByRole('combobox', { name: 'Buscar producto' }),
        pedido: () => within(screen.getByRole('region', { name: 'Pedido actual' })),
    }
    }

    describe('PuntoDeVenta', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('agrega con Enter y actualiza el total al instante', async () => {
        const { user, buscador, pedido } = montar()
        await user.type(buscador, 'limo{Enter}')
        expect(pedido().getByText('Limonada natural')).toBeInTheDocument()
        expect(pedido().getByRole('status', { name: 'Total' })).toHaveTextContent(/6\.000/)

        await user.type(buscador, 'limo{Enter}')
        expect(pedido().getByLabelText('Cantidad de Limonada natural')).toHaveValue('2')
        expect(pedido().getByRole('status', { name: 'Total' })).toHaveTextContent(/12\.000/)
    })

    it('no permite superar el stock disponible', async () => {
        const { user, buscador, pedido } = montar()
        for (let i = 0; i < 5; i++) await user.type(buscador, 'limo{Enter}')

        expect(pedido().getByLabelText('Cantidad de Limonada natural')).toHaveValue('3')
        expect(pedido().getByRole('button', { name: 'Aumentar cantidad de Limonada natural' })).toBeDisabled()
        // Los intentos de más generan un aviso cada uno, así que puede haber varios.
        expect((await screen.findAllByText(/No hay más stock disponible/)).length).toBeGreaterThan(0)
    })

    it('después de vender se puede descargar el comprobante de esa venta', async () => {
    descargarArchivo.mockResolvedValue(undefined)
    mutar.mockImplementation((_venta: unknown, opciones: { onSuccess: (v: unknown) => void }) =>
        opciones.onSuccess({ id: 9, total: 6000, metodo_pago: 'EFECTIVO' }),
    )
    const { user, buscador, pedido } = montar()
    await user.type(buscador, 'limo{Enter}')
    await user.click(pedido().getByRole('radio', { name: 'Efectivo' }))
    await user.click(pedido().getByRole('button', { name: 'Confirmar venta' }))

    await user.click(pedido().getByRole('button', { name: 'Descargar comprobante' }))
    expect(descargarArchivo).toHaveBeenCalledWith('/ventas/9/comprobante', 'comprobante-9.pdf')
    })

    it('no agrega un producto agotado', async () => {
        const { user, buscador, pedido } = montar()
        await user.type(buscador, 'brownie{Enter}')
        expect(pedido().getByText('Aún no has agregado productos.')).toBeInTheDocument()
        expect(await screen.findByText(/está agotado/)).toBeInTheDocument()
    })

    it('no permite cantidades menores que 1', async () => {
        const { user, buscador, pedido } = montar()
        await user.type(buscador, 'hamb{Enter}')
        expect(pedido().getByRole('button', { name: 'Disminuir cantidad de Hamburguesa clásica' })).toBeDisabled()
    })

    it('quita una línea del pedido', async () => {
        const { user, buscador, pedido } = montar()
        await user.type(buscador, 'hamb{Enter}')
        await user.click(pedido().getByRole('button', { name: 'Quitar Hamburguesa clásica del pedido' }))
        expect(pedido().getByText('Aún no has agregado productos.')).toBeInTheDocument()
    })

    it('sin método de pago no se puede confirmar', async () => {
        const { user, buscador, pedido } = montar()
        await user.type(buscador, 'hamb{Enter}')

        expect(pedido().getByRole('button', { name: 'Confirmar venta' })).toBeDisabled()
        expect(pedido().getByText('Elige el método de pago para confirmar la venta.')).toBeInTheDocument()

        await user.click(pedido().getByRole('radio', { name: 'Efectivo' }))
        expect(pedido().getByRole('button', { name: 'Confirmar venta' })).toBeEnabled()
    })

    it('al confirmar envía productos, cantidades y método de pago, y vacía el pedido', async () => {
        mutar.mockImplementation((_venta: unknown, opciones: { onSuccess: (v: unknown) => void }) =>
        opciones.onSuccess({ id: 7, total: 34000, metodo_pago: 'TARJETA' }),
        )
        const { user, buscador, pedido } = montar()
        await user.type(buscador, 'limo{Enter}')
        await user.type(buscador, 'limo{Enter}')
        await user.type(buscador, 'hamb{Enter}')
        await user.click(pedido().getByRole('radio', { name: 'Tarjeta' }))
        await user.click(pedido().getByRole('button', { name: 'Confirmar venta' }))

        expect(mutar).toHaveBeenCalledWith(
        {
            items: [{ producto_id: 1, cantidad: 2 }, { producto_id: 2, cantidad: 1 }],
            metodo_pago: 'TARJETA',
        },
        expect.anything(),
        )
        expect(pedido().getByText('Aún no has agregado productos.')).toBeInTheDocument()
        expect(pedido().getByText(/Venta #7 registrada/)).toBeInTheDocument()
        // Cada venta exige elegir el método otra vez
        expect(pedido().getByRole('radio', { name: 'Tarjeta' })).not.toBeChecked()
    })

    it('con el pedido vacío no se puede confirmar', () => {
        const { pedido } = montar()
        expect(pedido().getByRole('button', { name: 'Confirmar venta' })).toBeDisabled()
    })
})