import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Paginador } from './Paginador'

function montar(pagina: number, paginas = 5, onCambiar = vi.fn()) {
    render(<Paginador pagina={pagina} paginas={paginas} tamanio={25} total={120} onCambiar={onCambiar} />)
    return { onCambiar, user: userEvent.setup() }
    }

    describe('Paginador', () => {
    it('muestra el rango y la página actual', () => {
        montar(2)
        expect(screen.getByText('Mostrando 26–50 de 120')).toBeInTheDocument()
        expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
    })

    it('en la primera página no se puede retroceder', () => {
        montar(1)
        expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
    })

    it('en la última página no se puede avanzar', () => {
        montar(5)
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
    })

    it('avisa de la página elegida', async () => {
        const { user, onCambiar } = montar(2)
        await user.click(screen.getByRole('button', { name: 'Siguiente' }))
        expect(onCambiar).toHaveBeenLastCalledWith(3)
        await user.click(screen.getByRole('button', { name: 'Anterior' }))
        expect(onCambiar).toHaveBeenLastCalledWith(1)
    })

    it('mientras carga bloquea los dos botones', () => {
        render(<Paginador pagina={2} paginas={5} tamanio={25} total={120} onCambiar={vi.fn()} deshabilitado />)
        expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    })
})