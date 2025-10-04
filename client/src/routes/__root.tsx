import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import { useTheme } from '@/components/providers/theme-provider'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { BetterFetchError } from 'better-auth/react'

import { Toaster } from 'sonner'
interface User {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt:Date
  updatedAt:Date
  emailVerified:boolean
}
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: BetterFetchError | null
  currentSessionId:string | null
  refetch: () => void
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>
}
interface MyRouterContext {
  queryClient: QueryClient
  auth: AuthState
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    const {theme} = useTheme();
    return (
    
    <>
      <div className="flex-1 flex flex-col min-h-screen max-w-screen-2xl mx-auto w-full">
        
        <Nav/>
        <main className="flex-1 flex  flex-col">
          <Outlet />
        </main>
        <Toaster richColors theme={theme} position='top-right'/>
        <Footer />
      </div>

      <TanStackRouterDevtools />
    </>
  )}
})
