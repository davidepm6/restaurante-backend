import { lazy, Suspense } from 'react'
import { useMe } from '../api/me'
import Inicio from './Inicio'

const Dashboard = lazy(() => import('./Dashboard'))

export default function Portada() {
    const { data: me } = useMe()

    if (me?.role !== 'ADMINISTRADOR') return <Inicio />

    return (
        <Suspense fallback={<p>Cargando panel…</p>}>
        <Dashboard />
        </Suspense>
    )
}