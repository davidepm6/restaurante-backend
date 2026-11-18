import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMe } from '../../api/me'
import { RequireRole } from './RequireRole'

vi.mock('../../api/me', () => ({ useMe: vi.fn() }))

function simular(estado: object) {
    vi.mocked(useMe).mockReturnValue(estado as unknown as ReturnType<typeof useMe>)
}

function montar() {
    render(
        <MemoryRouter>
        <RequireRole roles={['ADMINISTRADOR']}>
            <p>Contenido secreto</p>
        </RequireRole>
        </MemoryRouter>,
    )
}

describe('RequireRole', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('muestra el contenido al rol permitido', () => {
        simular({ data: { clerk_user_id: 'u1', role: 'ADMINISTRADOR' }, isPending: false, error: null, refetch: vi.fn() })
        montar()
        expect(screen.getByText('Contenido secreto')).toBeInTheDocument()
    })

    it('muestra "Sin acceso" a otro rol y no renderiza el contenido', () => {
    simular({ data: { clerk_user_id: 'u2', role: 'EMPLEADO' }, isPending: false, error: null, refetch: vi.fn() })
    montar()
    expect(screen.getByText('Sin acceso')).toBeInTheDocument()
    expect(screen.queryByText('Contenido secreto')).not.toBeInTheDocument()
    })

    it('muestra "Sin acceso" a una cuenta sin rol', () => {
    simular({ data: { clerk_user_id: 'u3', role: null }, isPending: false, error: null, refetch: vi.fn() })
    montar()
    expect(screen.getByText('Sin acceso')).toBeInTheDocument()
    expect(screen.queryByText('Contenido secreto')).not.toBeInTheDocument()
    })

    it('mientras carga no renderiza el contenido ni decide el acceso', () => {
        simular({ data: undefined, isPending: true, error: null, refetch: vi.fn() })
        montar()
        expect(screen.queryByText('Contenido secreto')).not.toBeInTheDocument()
        expect(screen.queryByText('Sin acceso')).not.toBeInTheDocument()
    })
})