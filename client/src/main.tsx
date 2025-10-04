import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

import './styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from './components/providers/theme-provider.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { Spinner } from './components/ui/spinner.tsx'
const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
function InnerApp(){
  const auth = useAuth()
   if (auth.isLoading) {
    return (
      <div className="flex-1 grid place-items-center p-4">
        <Spinner/>
      </div>
    )
  }
  return <RouterProvider router={router} context={{ queryClient, auth }} />;
}
function Main() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InnerApp/>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<Main />)
}
