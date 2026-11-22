import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { RUTAS } from './auth/rutas'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/layout/RequireAuth'
import { RequireRole } from './components/layout/RequireRole'
import Categorias from './pages/Categorias'
import Empleados from './pages/Empleados'
import Muestrario from './pages/Muestrario'
import Portada from './pages/Portada'
import Productos from './pages/Productos'
import PuntoDeVenta from './pages/PuntoDeVenta'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import Ventas from './pages/Ventas'

function protegida(ruta: string, elemento: ReactElement) {
  const definicion = RUTAS.find((r) => r.ruta === ruta)
  if (!definicion) throw new Error(`La ruta ${ruta} no está definida en auth/rutas.ts`)
  if (definicion.roles === 'cualquiera') return elemento
  return <RequireRole roles={definicion.roles}>{elemento}</RequireRole>
}

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Portada />} />
        <Route path="punto-de-venta" element={protegida('/punto-de-venta', <PuntoDeVenta />)} />
        <Route path="ventas" element={protegida('/ventas', <Ventas />)} />
        <Route path="categorias" element={protegida('/categorias', <Categorias />)} />
        <Route path="productos" element={protegida('/productos', <Productos />)} />
        <Route path="empleados" element={protegida('/empleados', <Empleados />)} />
        {import.meta.env.DEV && <Route path="muestrario" element={protegida('/muestrario', <Muestrario />)} />}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}