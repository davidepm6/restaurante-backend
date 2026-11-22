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

const producto = (id: number, nombre: string, extra: Record<string, unknown> = {}) => ({
    id, nombre, precio: 6000, stock: 40, stock_minimo: 0, stock_bajo: false, categoria_id: 1, activo: true, creado_en: '', ...extra,
})

const PRODUCTOS = [
    producto(1, 'Limonada'),
    producto(2, 'Brownie', { precio: 12000, stock: 2, stock_minimo: 5, stock_bajo: true }),
    producto(3, 'Arepa', { precio: 3000, stock: 0, categoria_id: 2 }),
    ]

    const CATEGORIAS = [
    { id: 1, nombre: 'Bebidas', descripcion: null, creado_en: '' },
    { id: 2, nombre: 'Comidas', descripcion: null, creado_en: '' },
    ]

    function preparar(
    rol: 'ADMINISTRADOR' | 'EMPLEADO',
    { productos = PRODUCTOS, url = '/productos' }: { productos?: unknown[]; url?: string } = {},
    ) {
    vi.mocked(useMe).mockReturnValue({ data: { clerk_user_id: 'u1', role: rol } } as unknown as ReturnType<typeof useMe>)
    vi.mocked(useProductos).mockReturnValue({
        data: productos,
        isPending: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useProductos>)
    vi.mocked(useCategorias).mockReturnValue({
        data: CATEGORIAS,
        isPending: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategorias>)
    vi.mocked(useCrearProducto).mockReturnValue({ mutate: crear, isPending: false } as unknown as ReturnType<typeof useCrearProducto>)
    vi.mocked(useActualizarProducto).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useActualizarProducto>)
    vi.mocked(useDesactivarProducto).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDesactivarProducto>)

    render(
        <MemoryRouter initialEntries={[url]}>
        <ToastProvider>
            <Productos />
        </ToastProvider>
        </MemoryRouter>,
    )
    return { user: userEvent.setup(), tabla: () => within(screen.getByRole('table')) }
    }

    const MUCHOS = Array.from({ length: 30 }, (_, i) => producto(i + 1, `Producto ${i + 1}`))

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

    it('el empleado solo ve la tabla, sin acciones de edición ni filtro de stock bajo', () => {
        const { tabla } = preparar('EMPLEADO')
        expect(tabla().getByText('Limonada')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Nuevo producto' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Desactivar/ })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Solo stock bajo/ })).not.toBeInTheDocument()
    })

    it('el empleado sí puede buscar y filtrar por categoría', () => {
        preparar('EMPLEADO')
        expect(screen.getByLabelText('Buscar producto')).toBeInTheDocument()
        expect(screen.getByLabelText('Filtrar por categoría')).toBeInTheDocument()
    })

    it('marca el stock bajo y los agotados, también para el empleado', () => {
        const { tabla } = preparar('EMPLEADO')
        expect(tabla().getAllByText('Stock bajo')).toHaveLength(1)
        expect(tabla().getAllByText('Agotado')).toHaveLength(1)
    })

    describe('búsqueda y filtros', () => {
        it('busca por nombre sin distinguir tildes ni mayúsculas', async () => {
        const { user, tabla } = preparar('ADMINISTRADOR')
        await user.type(screen.getByLabelText('Buscar producto'), 'BROW')

        expect(tabla().getByText('Brownie')).toBeInTheDocument()
        expect(tabla().queryByText('Limonada')).not.toBeInTheDocument()
        expect(tabla().queryByText('Arepa')).not.toBeInTheDocument()
        })

        it('filtra por categoría', async () => {
        const { user, tabla } = preparar('ADMINISTRADOR')
        await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), '2')

        expect(tabla().getByText('Arepa')).toBeInTheDocument()
        expect(tabla().queryByText('Limonada')).not.toBeInTheDocument()
        })

        it('el administrador puede filtrar solo los productos con stock bajo', async () => {
        const { user, tabla } = preparar('ADMINISTRADOR')
        const filtro = screen.getByRole('button', { name: 'Solo stock bajo (1)' })
        expect(filtro).toHaveAttribute('aria-pressed', 'false')

        await user.click(filtro)

        expect(filtro).toHaveAttribute('aria-pressed', 'true')
        expect(tabla().getByText('Brownie')).toBeInTheDocument()
        expect(tabla().queryByText('Limonada')).not.toBeInTheDocument()

        await user.click(filtro)
        expect(tabla().getByText('Limonada')).toBeInTheDocument()
        })

        it('los filtros se leen de la dirección al entrar', () => {
        const { tabla } = preparar('ADMINISTRADOR', { url: '/productos?q=lim' })
        expect(screen.getByLabelText('Buscar producto')).toHaveValue('lim')
        expect(tabla().getByText('Limonada')).toBeInTheDocument()
        expect(tabla().queryByText('Brownie')).not.toBeInTheDocument()
        })

        it('la dirección puede traer varios filtros a la vez', () => {
        const { tabla } = preparar('ADMINISTRADOR', { url: '/productos?categoria=1&bajo=1' })
        expect(screen.getByRole('button', { name: 'Solo stock bajo (1)' })).toHaveAttribute('aria-pressed', 'true')
        expect(tabla().getByText('Brownie')).toBeInTheDocument()
        expect(tabla().queryByText('Limonada')).not.toBeInTheDocument()
        })

        it('sin coincidencias explica por qué y permite limpiar los filtros', async () => {
        const { user, tabla } = preparar('ADMINISTRADOR')
        await user.type(screen.getByLabelText('Buscar producto'), 'zzz')
        expect(screen.getByText('Ningún producto coincide con los filtros.')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
        expect(screen.getByLabelText('Buscar producto')).toHaveValue('')
        expect(tabla().getByText('Limonada')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
        })
    })

    describe('paginación', () => {
        it('muestra 25 por página y permite avanzar', async () => {
        const { user, tabla } = preparar('ADMINISTRADOR', { productos: MUCHOS })
        expect(tabla().getAllByRole('row')).toHaveLength(26) // encabezado + 25
        expect(screen.getByText('Mostrando 1–25 de 30')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Siguiente' }))

        expect(screen.getByText('Mostrando 26–30 de 30')).toBeInTheDocument()
        expect(tabla().getAllByRole('row')).toHaveLength(6) // encabezado + 5
        })

        it('una página inexistente en la dirección se ajusta a la última', () => {
        preparar('ADMINISTRADOR', { productos: MUCHOS, url: '/productos?pagina=9' })
        expect(screen.getByText('Mostrando 26–30 de 30')).toBeInTheDocument()
        })

        it('un cambio de filtro vuelve a la primera página', async () => {
        const { user } = preparar('ADMINISTRADOR', { productos: MUCHOS, url: '/productos?pagina=2' })
        expect(screen.getByText('Mostrando 26–30 de 30')).toBeInTheDocument()

        await user.type(screen.getByLabelText('Buscar producto'), '1')

        // Entre «Producto 1» … «Producto 30», contienen un 1: 1, 10 al 19 y 21.
        expect(screen.getByText('Mostrando 1–12 de 12')).toBeInTheDocument()
        })

        it('con pocos productos no hay una segunda página', () => {
        preparar('ADMINISTRADOR')
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
        expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
        })
    })

    describe('formulario', () => {
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
})