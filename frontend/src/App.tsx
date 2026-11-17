import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/layout/RequireAuth'
import Inicio from './pages/Inicio'
import SignInPage from './pages/SignInPage'
import Muestrario from './pages/Muestrario'
import Empleados from './pages/Empleados'
import SignUpPage from './pages/SignUpPage'

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
        <Route path="empleados" element={<Empleados />} />
        {import.meta.env.DEV && (
          <Route path="muestrario" element={<Muestrario />} />
        )}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}