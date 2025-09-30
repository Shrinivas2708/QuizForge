import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import { useTheme } from '@/components/providers/theme-provider'
import { Outlet, createRootRoute } from '@tanstack/react-router'

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: () => {
    const {theme} = useTheme();
    return (
    
    <>
      <div className="flex-1 flex flex-col min-h-screen max-w-screen-2xl mx-auto w-full">
        
        <Nav/>
        <main className="flex-1 flex flex-1 flex-col">
          <Outlet />
        </main>
        <Toaster richColors theme={theme} position='top-right'/>
        <Footer />
      </div>

      <TanStackRouterDevtools />
    </>
  )}
})
