import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

describe('Dialog con formulario', () => {
    it('el botón de confirmar envía el formulario indicado', () => {
        render(
        <Dialog abierto titulo="Editar" formId="mi-formulario" onCancelar={vi.fn()}>
            <form id="mi-formulario" />
        </Dialog>,
        )
        const boton = screen.getByRole('button', { name: 'Confirmar' })
        expect(boton).toHaveAttribute('type', 'submit')
        expect(boton).toHaveAttribute('form', 'mi-formulario')
    })
})