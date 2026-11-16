import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field } from './Field'

describe('Field', () => {
    it('asocia la etiqueta con el campo', () => {
        render(<Field etiqueta="Nombre" />)
        expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    })

    it('muestra el error y marca el campo como inválido', () => {
        render(<Field etiqueta="Precio" error="El precio debe ser mayor que cero" />)
        expect(screen.getByRole('alert')).toHaveTextContent('El precio debe ser mayor que cero')
        expect(screen.getByLabelText('Precio')).toBeInvalid()
    })

    it('vincula la ayuda con el campo', () => {
        render(<Field etiqueta="Stock" ayuda="Unidades disponibles" />)
        expect(screen.getByLabelText('Stock')).toHaveAccessibleDescription('Unidades disponibles')
    })
})