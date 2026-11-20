import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectorPago } from './SelectorPago'

describe('SelectorPago', () => {
    it('ofrece los tres métodos y ninguno viene elegido', () => {
        render(<SelectorPago valor={null} onCambiar={vi.fn()} />)
        expect(screen.getByRole('group', { name: 'Método de pago' })).toBeInTheDocument()
        expect(screen.getAllByRole('radio')).toHaveLength(3)
        for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked()
    })

    it('avisa del método elegido', async () => {
        const onCambiar = vi.fn()
        render(<SelectorPago valor={null} onCambiar={onCambiar} />)
        await userEvent.setup().click(screen.getByRole('radio', { name: 'Tarjeta' }))
        expect(onCambiar).toHaveBeenCalledWith('TARJETA')
    })

    it('marca el método actual', () => {
        render(<SelectorPago valor="EFECTIVO" onCambiar={vi.fn()} />)
        expect(screen.getByRole('radio', { name: 'Efectivo' })).toBeChecked()
    })

    it('no permite cambiar mientras está deshabilitado', () => {
        render(<SelectorPago valor={null} onCambiar={vi.fn()} deshabilitado />)
        for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled()
    })
})