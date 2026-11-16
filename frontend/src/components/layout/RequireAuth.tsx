import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Show } from '@clerk/react'

export function RequireAuth({ children }: { children: ReactNode }) {
    return (
        <>
        <Show when="signed-in">{children}</Show>
        <Show when="signed-out">
            <Navigate to="/sign-in" replace />
        </Show>
        </>
    )
}