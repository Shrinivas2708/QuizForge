import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import { useTheme } from '@/components/providers/theme-provider'
import type { QueryClient } from '@tanstack/react-query'
import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { BetterFetchError } from 'better-auth/react'

import { Toaster } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
  emailVerified: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: BetterFetchError | null
  currentSessionId: string | null
  refetch: () => void
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>
}

interface MyRouterContext {
  queryClient: QueryClient
  auth: AuthState
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { theme } = useTheme()
  const routerState = useRouterState()

  // Check if we're on an authenticated route
  const isAuthenticatedRoute =
    routerState.location.pathname.startsWith('/_authenticated') ||
    routerState.matches.some((match) =>
      match.routeId.includes('/_authenticated'),
    )

  return (
    <>
      {isAuthenticatedRoute ? (
        // Authenticated routes get full control (sidebar layout)
        <div className="min-h-screen w-full">
          <Outlet />
        </div>
      ) : (
        // Public routes get Nav/Footer
        <div className="flex flex-col min-h-screen max-w-screen-2xl mx-auto w-full">
          <Nav />
          <main className="flex-1 flex flex-col">
            <Outlet />
          </main>
          <Footer />
        </div>
      )}

      <Toaster richColors theme={theme} position="top-right" />
      <TanStackRouterDevtools />
    </>
  )
}
