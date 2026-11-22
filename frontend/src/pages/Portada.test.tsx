import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMe } from '../api/me'
import Portada from './Portada'

vi.mock('../api/me', () => ({ useMe: vi.fn() }))

vi.mock('./Inicio', async () => {
    const React = await import('react')
    return { default: () => React.createElement('p', null, 'Pantalla de inicio') }
    })

    vi.mock('./Dashboard', async () => {
    const React = await import('react')
    return { default: () => React.createElement('p', null, 'Panel de indicadores') }
    })

    function conRol(role: string | null | undefined) {
    vi.mocked(useMe).mockReturnValue({
        data: role === undefined ? undefined : { clerk_user_id: 'u1', role },
    } as unknown as ReturnType<typeof useMe>)
    render(<Portada />)
    }

    describe('Portada', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('el administrador ve el panel', async () => {
        conRol('ADMINISTRADOR')
        expect(await screen.findByText('Panel de indicadores')).toBeInTheDocument()
        expect(screen.queryByText('Pantalla de inicio')).not.toBeInTheDocument()
    })

    it('el empleado ve el inicio de siempre y nunca carga el panel', () => {
        conRol('EMPLEADO')
        expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
        expect(screen.queryByText('Panel de indicadores')).not.toBeInTheDocument()
    })

    it('una cuenta sin rol ve el inicio', () => {
        conRol(null)
        expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
    })

    it('mientras no se sabe el rol se muestra el inicio, que ya maneja su propia carga', () => {
        conRol(undefined)
        expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
        expect(screen.queryByText('Panel de indicadores')).not.toBeInTheDocument()
    })
})