import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

describe('Select', () => {
    it('asocia la etiqueta con la lista', () => {
        render(
        <Select etiqueta="Categoría">
            <option value="1">Bebidas</option>
        </Select>,
        )
        expect(screen.getByLabelText('Categoría')).toBeInTheDocument()
    })

    it('muestra el error y marca la lista como inválida', () => {
        render(
        <Select etiqueta="Categoría" error="Elige una categoría.">
            <option value="">Elige</option>
        </Select>,
        )
        expect(screen.getByRole('alert')).toHaveTextContent('Elige una categoría.')
        expect(screen.getByLabelText('Categoría')).toBeInvalid()
    })

    it('avisa del cambio de selección', async () => {
        const onChange = vi.fn()
        render(
        <Select etiqueta="Categoría" onChange={onChange}>
            <option value="">Elige</option>
            <option value="1">Bebidas</option>
        </Select>,
        )
        await userEvent.setup().selectOptions(screen.getByLabelText('Categoría'), '1')
        expect(onChange).toHaveBeenCalled()
    })
})