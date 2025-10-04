import { AppSidebar } from '@/components/app-sidebar'
import Nav from '@/components/Nav'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'
import { sidebarRoutes } from '@/lib/exports'
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && !context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})


function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { location } = useRouterState()

  // ✅ Check if the current route should have a sidebar
  const hasSidebar = sidebarRoutes.some((route) =>
    location.pathname.startsWith(route),
  )

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/', replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // ✅ If the route needs a sidebar, render the full sidebar layout
  if (hasSidebar) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="flex  shrink-0 items-center gap-2 border-b px-4 ">
            <SidebarTrigger className="-ml-1" />
            <Nav />
          </header>
          <div className="flex flex-1 flex-col gap-4  overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // ✅ For authenticated routes without a sidebar (like /profile), just render the content.
  // The Nav and Footer will be provided by the root layout in the next step.
  return <Outlet />
}