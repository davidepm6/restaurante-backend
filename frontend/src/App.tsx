import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { RUTAS } from './auth/rutas'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/layout/RequireAuth'
import { RequireRole } from './components/layout/RequireRole'
import Empleados from './pages/Empleados'
import Inicio from './pages/Inicio'
import Muestrario from './pages/Muestrario'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import Categorias from './pages/Categorias'
import Productos from './pages/Productos'

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
        <Route index element={<Inicio />} />
        <Route path="categorias" element={protegida('/categorias', <Categorias />)} />
        <Route path="empleados" element={protegida('/empleados', <Empleados />)} />
        <Route path="productos" element={protegida('/productos', <Productos />)} />
        {import.meta.env.DEV && <Route path="muestrario" element={protegida('/muestrario', <Muestrario />)} />}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}