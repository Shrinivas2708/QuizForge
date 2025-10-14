import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'
import { useTheme } from '@/providers/theme-provider'
const Comp = () =>{ 
  const {theme} = useTheme()
  return(
    <>
      <Outlet />
       <Toaster richColors theme={theme} position="top-right" />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )}
export const Route = createRootRoute({
  component: Comp
})
