import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './toast-context'

function Disparador() {
    const { avisar } = useToast()
    return <button onClick={() => avisar('Categoría creada', 'ok')}>Avisar</button>
}

describe('ToastProvider', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('muestra el aviso y lo retira solo', () => {
        vi.useFakeTimers()
        render(
        <ToastProvider>
            <Disparador />
        </ToastProvider>,
        )

        fireEvent.click(screen.getByText('Avisar'))
        expect(screen.getByText('Categoría creada')).toBeInTheDocument()

        act(() => {
        vi.advanceTimersByTime(4100)
        })
        expect(screen.queryByText('Categoría creada')).not.toBeInTheDocument()
    })
    })