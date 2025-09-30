import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import { Outlet, createRootRoute } from '@tanstack/react-router'

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex-1 flex flex-col min-h-screen max-w-screen-2xl mx-auto w-full">
        
        <Nav/>
        <Outlet />
        <Footer />
      </div>

      <TanStackRouterDevtools />
    </>
  ),
})
