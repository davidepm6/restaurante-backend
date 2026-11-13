import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router'
import { ClerkProvider } from '@clerk/react'
import { esMX } from '@clerk/localizations'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'
import { ToastProvider } from './components/ui/ToastProvider'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Falta VITE_CLERK_PUBLISHABLE_KEY en frontend/.env.local')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function RootLayout() {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      localization={esMX}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#a8442e',
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          borderRadius: '6px',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RootLayout />
    </BrowserRouter>
  </StrictMode>,
)