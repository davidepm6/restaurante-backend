import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
    it('llama a onClick al pulsarlo', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Guardar</Button>)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
})

    it('queda deshabilitado y no dispara onClick mientras carga', async () => {
        const onClick = vi.fn()
        render(<Button cargando onClick={onClick}>Guardar</Button>)
        const boton = screen.getByRole('button', { name: 'Guardar' })
        expect(boton).toBeDisabled()
        await userEvent.setup().click(boton)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('no envía formularios por defecto', () => {
    render(<Button>Aceptar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })
})