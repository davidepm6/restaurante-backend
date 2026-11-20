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

function preparar(rol: 'ADMINISTRADOR' | 'EMPLEADO') {
    vi.mocked(useMe).mockReturnValue({ data: { clerk_user_id: 'u1', role: rol } } as unknown as ReturnType<typeof useMe>)
    vi.mocked(useProductos).mockReturnValue({
        data: [{ id: 1, nombre: 'Limonada', precio: 6000, stock: 40, categoria_id: 1, activo: true, creado_en: '2026-01-01T00:00:00Z' }],
        isPending: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useProductos>)
    vi.mocked(useCategorias).mockReturnValue({
        data: [{ id: 1, nombre: 'Bebidas', descripcion: null, creado_en: '2026-01-01T00:00:00Z' }],
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
    }

    describe('Productos', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('el administrador ve la tabla con la categoría y el precio, y las acciones', () => {
        preparar('ADMINISTRADOR')
        const tabla = within(screen.getByRole('table'))
        expect(tabla.getByText('Limonada')).toBeInTheDocument()
        expect(tabla.getByText('Bebidas')).toBeInTheDocument()
        expect(tabla.getByText(/6\.000/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Editar Limonada' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Desactivar Limonada' })).toBeInTheDocument()
    })

    it('el empleado solo ve la tabla, sin acciones de edición', () => {
        preparar('EMPLEADO')
        expect(within(screen.getByRole('table')).getByText('Limonada')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Nuevo producto' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Desactivar/ })).not.toBeInTheDocument()
    })

    it('no envía el formulario vacío y explica cada error', async () => {
        preparar('ADMINISTRADOR')
        await userEvent.setup().click(screen.getByRole('button', { name: 'Nuevo producto' }))
        fireEvent.submit(document.getElementById('form-producto')!)

        expect(await screen.findByText('Escribe el nombre del producto.')).toBeInTheDocument()
        expect(screen.getByText('Escribe el precio.')).toBeInTheDocument()
        expect(screen.getByText('Escribe el stock.')).toBeInTheDocument()
        expect(screen.getByText('Elige una categoría.')).toBeInTheDocument()
        expect(crear).not.toHaveBeenCalled()
    })

    it('con datos válidos envía números y el id de la categoría', async () => {
        preparar('ADMINISTRADOR')
        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: 'Nuevo producto' }))
        await user.type(screen.getByLabelText('Nombre'), 'Jugo de mora')
        await user.type(screen.getByLabelText('Precio (COP)'), '7000')
        await user.type(screen.getByLabelText('Stock'), '15')
        await user.selectOptions(screen.getByLabelText('Categoría'), '1')
        fireEvent.submit(document.getElementById('form-producto')!)

        expect(crear).toHaveBeenCalledWith(
        { nombre: 'Jugo de mora', precio: 7000, stock: 15, categoria_id: 1 },
        expect.anything(),
        )
    })
})