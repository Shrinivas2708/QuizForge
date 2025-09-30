import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import { ThemeButton } from '@/components/toggle-theme'
import { Outlet, createRootRoute } from '@tanstack/react-router'

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex-1 flex flex-col max-w-screen-2xl mx-auto">
        
        <Nav/>
        <Outlet />
        <Footer />
      </div>

      <TanStackRouterDevtools />
    </>
  ),
})
