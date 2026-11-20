import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function preparar() {
    vi.mocked(useCategorias).mockReturnValue({
    data: [{ id: 1, nombre: 'Bebidas', descripcion: null, creado_en: '2026-01-01T00:00:00Z' }],
    isPending: false,
    error: null,
    refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategorias>)
    vi.mocked(useCrearCategoria).mockReturnValue({ mutate: crear, isPending: false } as unknown as ReturnType<typeof useCrearCategoria>)
    vi.mocked(useActualizarCategoria).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useActualizarCategoria>)
    vi.mocked(useEliminarCategoria).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useEliminarCategoria>)

    render(
        <ToastProvider>
        <Categorias />
        </ToastProvider>,
    )
}

describe('Categorias', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('lista las categorías existentes', () => {
        preparar()
        expect(screen.getByText('Bebidas')).toBeInTheDocument()
    })

    it('no envía el formulario vacío y explica el error', async () => {
        preparar()
        await userEvent.setup().click(screen.getByRole('button', { name: 'Nueva categoría' }))
        fireEvent.submit(document.getElementById('form-categoria')!)

        expect(await screen.findByText('Escribe el nombre de la categoría.')).toBeInTheDocument()
        expect(crear).not.toHaveBeenCalled()
    })

    it('con datos válidos envía los valores sin espacios sobrantes', async () => {
    preparar()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    await user.type(screen.getByLabelText('Nombre'), '  Postres  ')
    fireEvent.submit(document.getElementById('form-categoria')!)

    expect(crear).toHaveBeenCalledWith({ nombre: 'Postres', descripcion: '' }, expect.anything())
    })
})