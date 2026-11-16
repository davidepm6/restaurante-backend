import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

function montar(abierto: boolean) {
    const onConfirmar = vi.fn()
    const onCancelar = vi.fn()
    render(
        <Dialog abierto={abierto} titulo="Eliminar categoría" textoConfirmar="Eliminar" peligro onConfirmar={onConfirmar} onCancelar={onCancelar}>
        Esta acción no se puede deshacer.
        </Dialog>,
    )
    return { onConfirmar, onCancelar }
    }

    describe('Dialog', () => {
    it('no se muestra cuando está cerrado', () => {
        montar(false)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('se muestra con su título cuando está abierto', () => {
        montar(true)
        expect(screen.getByRole('dialog', { name: 'Eliminar categoría' })).toBeInTheDocument()
    })

    it('llama a onConfirmar al confirmar', async () => {
        const { onConfirmar } = montar(true)
        await userEvent.setup().click(screen.getByRole('button', { name: 'Eliminar' }))
        expect(onConfirmar).toHaveBeenCalledTimes(1)
    })

    it('llama a onCancelar al cancelar', async () => {
        const { onCancelar } = montar(true)
        await userEvent.setup().click(screen.getByRole('button', { name: 'Cancelar' }))
        expect(onCancelar).toHaveBeenCalledTimes(1)
    })
})