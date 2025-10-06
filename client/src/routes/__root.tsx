import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import { useTheme } from '@/components/providers/theme-provider'
import { sidebarRoutes } from '@/lib/exports'
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

  const hasSidebarLayout = sidebarRoutes.some((route) =>
    routerState.location.pathname.startsWith(route),
  )

  return (
    <>
      {hasSidebarLayout ? (
        // Routes WITH sidebar: fixed height, no scrolling at root level
        <div className="h-screen w-full overflow-hidden">
          <Outlet />
        </div>
      ) : (
        // Public routes AND authenticated routes WITHOUT sidebar
        <div className="flex min-h-screen w-full max-w-screen-2xl mx-auto flex-col">
          <Nav />
          <main className="flex flex-1 flex-col">
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