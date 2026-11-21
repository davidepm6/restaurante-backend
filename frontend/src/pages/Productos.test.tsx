import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    useActualizarProducto,
    useCategorias,
    useCrearProducto,
    useDesactivarProducto,
    useProductos,
    } from '../api/catalogo'
    import { useMe } from '../api/me'
    import { ToastProvider } from '../components/ui/ToastProvider'
    import Productos from './Productos'

    vi.mock('../api/me', () => ({ useMe: vi.fn() }))
    vi.mock('../api/catalogo', () => ({
    useProductos: vi.fn(),
    useCategorias: vi.fn(),
    useCrearProducto: vi.fn(),
    useActualizarProducto: vi.fn(),
    useDesactivarProducto: vi.fn(),
    }))

    const crear = vi.fn()

    const PRODUCTOS = [
    { id: 1, nombre: 'Limonada', precio: 6000, stock: 40, stock_minimo: 0, stock_bajo: false, categoria_id: 1, activo: true, creado_en: '' },
    { id: 2, nombre: 'Brownie', precio: 12000, stock: 2, stock_minimo: 5, stock_bajo: true, categoria_id: 1, activo: true, creado_en: '' },
    { id: 3, nombre: 'Arepa', precio: 3000, stock: 0, stock_minimo: 0, stock_bajo: false, categoria_id: 1, activo: true, creado_en: '' },
    ]

    function preparar(rol: 'ADMINISTRADOR' | 'EMPLEADO') {
    vi.mocked(useMe).mockReturnValue({ data: { clerk_user_id: 'u1', role: rol } } as unknown as ReturnType<typeof useMe>)
    vi.mocked(useProductos).mockReturnValue({
        data: PRODUCTOS,
        isPending: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useProductos>)
    vi.mocked(useCategorias).mockReturnValue({
        data: [{ id: 1, nombre: 'Bebidas', descripcion: null, creado_en: '' }],
        isPending: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategorias>)
    vi.mocked(useCrearProducto).mockReturnValue({ mutate: crear, isPending: false } as unknown as ReturnType<typeof useCrearProducto>)
    vi.mocked(useActualizarProducto).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useActualizarProducto>)
    vi.mocked(useDesactivarProducto).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDesactivarProducto>)

    render(
        <MemoryRouter>
        <ToastProvider>
            <Productos />
        </ToastProvider>
        </MemoryRouter>,
    )
    return { user: userEvent.setup(), tabla: () => within(screen.getByRole('table')) }
    }

    describe('Productos', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('el administrador ve la tabla con la categoría, el precio y las acciones', () => {
        const { tabla } = preparar('ADMINISTRADOR')
        expect(tabla().getByText('Limonada')).toBeInTheDocument()
        expect(tabla().getAllByText('Bebidas').length).toBeGreaterThan(0)
        expect(tabla().getByText(/6\.000/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Editar Limonada' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Desactivar Limonada' })).toBeInTheDocument()
    })

    it('el empleado solo ve la tabla, sin acciones de edición ni filtro', () => {
        const { tabla } = preparar('EMPLEADO')
        expect(tabla().getByText('Limonada')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Nuevo producto' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Desactivar/ })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Solo stock bajo/ })).not.toBeInTheDocument()
    })

    it('marca el stock bajo y los agotados, también para el empleado', () => {
        const { tabla } = preparar('EMPLEADO')
        expect(tabla().getAllByText('Stock bajo')).toHaveLength(1)
        expect(tabla().getAllByText('Agotado')).toHaveLength(1)
    })

    it('el administrador puede filtrar solo los productos con stock bajo', async () => {
        const { user, tabla } = preparar('ADMINISTRADOR')
        const filtro = screen.getByRole('button', { name: 'Solo stock bajo (1)' })
        expect(filtro).toHaveAttribute('aria-pressed', 'false')

        await user.click(filtro)

        expect(filtro).toHaveAttribute('aria-pressed', 'true')
        expect(tabla().getByText('Brownie')).toBeInTheDocument()
        expect(tabla().queryByText('Limonada')).not.toBeInTheDocument()
        expect(tabla().queryByText('Arepa')).not.toBeInTheDocument()

        await user.click(filtro)
        expect(tabla().getByText('Limonada')).toBeInTheDocument()
    })

    it('no envía el formulario vacío y explica cada error', async () => {
        const { user } = preparar('ADMINISTRADOR')
        await user.click(screen.getByRole('button', { name: 'Nuevo producto' }))
        fireEvent.submit(document.getElementById('form-producto')!)

        expect(await screen.findByText('Escribe el nombre del producto.')).toBeInTheDocument()
        expect(screen.getByText('Escribe el precio.')).toBeInTheDocument()
        expect(screen.getByText('Escribe el stock.')).toBeInTheDocument()
        expect(screen.getByText('Elige una categoría.')).toBeInTheDocument()
        expect(crear).not.toHaveBeenCalled()
    })

    it('el stock mínimo empieza en 0 y no admite negativos', async () => {
        const { user } = preparar('ADMINISTRADOR')
        await user.click(screen.getByRole('button', { name: 'Nuevo producto' }))
        expect(screen.getByLabelText('Stock mínimo')).toHaveValue(0)

        await user.type(screen.getByLabelText('Nombre'), 'Jugo')
        await user.type(screen.getByLabelText('Precio (COP)'), '7000')
        await user.type(screen.getByLabelText('Stock'), '15')
        await user.selectOptions(screen.getByLabelText('Categoría'), '1')
        await user.clear(screen.getByLabelText('Stock mínimo'))
        await user.type(screen.getByLabelText('Stock mínimo'), '-3')
        fireEvent.submit(document.getElementById('form-producto')!)

        expect(await screen.findByText('El stock mínimo no puede ser negativo.')).toBeInTheDocument()
        expect(crear).not.toHaveBeenCalled()
    })

    it('con datos válidos envía números, el stock mínimo y el id de la categoría', async () => {
        const { user } = preparar('ADMINISTRADOR')
        await user.click(screen.getByRole('button', { name: 'Nuevo producto' }))
        await user.type(screen.getByLabelText('Nombre'), 'Jugo de mora')
        await user.type(screen.getByLabelText('Precio (COP)'), '7000')
        await user.type(screen.getByLabelText('Stock'), '15')
        await user.clear(screen.getByLabelText('Stock mínimo'))
        await user.type(screen.getByLabelText('Stock mínimo'), '5')
        await user.selectOptions(screen.getByLabelText('Categoría'), '1')
        fireEvent.submit(document.getElementById('form-producto')!)

        expect(crear).toHaveBeenCalledWith(
        { nombre: 'Jugo de mora', precio: 7000, stock: 15, stock_minimo: 5, categoria_id: 1 },
        expect.anything(),
        )
    })
})