import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { useTheme } from '@/providers/theme-provider'
const Comp = () =>{ 
  const {theme} = useTheme()
  return(
    <>
      <Outlet />
       <Toaster richColors theme={theme} position="top-right" />
    
    </>
  )}
export const Route = createRootRoute({
  component: Comp
})
