import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    useActualizarCategoria,
    useCategorias,
    useCrearCategoria,
    useEliminarCategoria,
} from '../api/catalogo'
import { ToastProvider } from '../components/ui/ToastProvider'
import Categorias from './Categorias'

vi.mock('../api/catalogo', () => ({
    useCategorias: vi.fn(),
    useCrearCategoria: vi.fn(),
    useActualizarCategoria: vi.fn(),
    useEliminarCategoria: vi.fn(),
}))

const crear = vi.fn()

const categoria = (id: number, nombre: string, descripcion: string | null = null) => ({
    id, nombre, descripcion, creado_en: '2026-01-01T00:00:00Z',
})

const POCAS = [categoria(1, 'Bebidas', 'Jugos y gaseosas'), categoria(2, 'Postres')]
const MUCHAS = Array.from({ length: 30 }, (_, i) => categoria(i + 1, `Categoría ${String(i + 1).padStart(2, '0')}`))

function preparar(categorias: unknown[] = POCAS, url = '/categorias') {
    vi.mocked(useCategorias).mockReturnValue({
        data: categorias,
        isPending: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategorias>)
    vi.mocked(useCrearCategoria).mockReturnValue({ mutate: crear, isPending: false } as unknown as ReturnType<typeof useCrearCategoria>)
    vi.mocked(useActualizarCategoria).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useActualizarCategoria>)
    vi.mocked(useEliminarCategoria).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useEliminarCategoria>)

    render(
        <MemoryRouter initialEntries={[url]}>
        <ToastProvider>
            <Categorias />
        </ToastProvider>
        </MemoryRouter>,
    )
    return { user: userEvent.setup(), tabla: () => within(screen.getByRole('table')) }
    }

    describe('Categorias', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('lista las categorías existentes', () => {
        const { tabla } = preparar()
        expect(tabla().getByText('Bebidas')).toBeInTheDocument()
        expect(tabla().getByText('Postres')).toBeInTheDocument()
    })

    it('no envía el formulario vacío y explica el error', async () => {
        const { user } = preparar()
        await user.click(screen.getByRole('button', { name: 'Nueva categoría' }))
        fireEvent.submit(document.getElementById('form-categoria')!)

        expect(await screen.findByText('Escribe el nombre de la categoría.')).toBeInTheDocument()
        expect(crear).not.toHaveBeenCalled()
    })

    it('con datos válidos envía los valores sin espacios sobrantes', async () => {
        const { user } = preparar()
        await user.click(screen.getByRole('button', { name: 'Nueva categoría' }))
        await user.type(screen.getByLabelText('Nombre'), '  Entradas  ')
        fireEvent.submit(document.getElementById('form-categoria')!)

        expect(crear).toHaveBeenCalledWith({ nombre: 'Entradas', descripcion: '' }, expect.anything())
    })

    describe('búsqueda', () => {
        it('busca por nombre sin distinguir tildes ni mayúsculas', async () => {
        const { user, tabla } = preparar([categoria(1, 'Bebidas'), categoria(2, 'Postres'), categoria(3, 'Sándwiches')])
        await user.type(screen.getByLabelText('Buscar categoría'), 'SANDWICH')

        expect(tabla().getByText('Sándwiches')).toBeInTheDocument()
        expect(tabla().queryByText('Bebidas')).not.toBeInTheDocument()
        })

        it('también busca dentro de la descripción', async () => {
        const { user, tabla } = preparar()
        await user.type(screen.getByLabelText('Buscar categoría'), 'gaseosa')

        expect(tabla().getByText('Bebidas')).toBeInTheDocument()
        expect(tabla().queryByText('Postres')).not.toBeInTheDocument()
        })

        it('la búsqueda se lee de la dirección al entrar', () => {
        const { tabla } = preparar(POCAS, '/categorias?q=post')
        expect(screen.getByLabelText('Buscar categoría')).toHaveValue('post')
        expect(tabla().getByText('Postres')).toBeInTheDocument()
        expect(tabla().queryByText('Bebidas')).not.toBeInTheDocument()
        })

        it('sin coincidencias explica por qué y permite limpiar la búsqueda', async () => {
        const { user, tabla } = preparar()
        await user.type(screen.getByLabelText('Buscar categoría'), 'zzz')
        expect(screen.getByText('Ninguna categoría coincide con la búsqueda.')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
        expect(tabla().getByText('Bebidas')).toBeInTheDocument()
        })
    })

    describe('paginación', () => {
        it('muestra 25 por página y permite avanzar', async () => {
        const { user, tabla } = preparar(MUCHAS)
        expect(tabla().getAllByRole('row')).toHaveLength(26)
        expect(screen.getByText('Mostrando 1–25 de 30')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Siguiente' }))

        expect(screen.getByText('Mostrando 26–30 de 30')).toBeInTheDocument()
        expect(tabla().getAllByRole('row')).toHaveLength(6)
        })

        it('al buscar vuelve a la primera página', async () => {
        const { user } = preparar(MUCHAS, '/categorias?pagina=2')
        expect(screen.getByText('Mostrando 26–30 de 30')).toBeInTheDocument()

        await user.type(screen.getByLabelText('Buscar categoría'), 'Categoría 0')

        // «Categoría 01» al «Categoría 09»
        expect(screen.getByText('Mostrando 1–9 de 9')).toBeInTheDocument()
        })
    })
})