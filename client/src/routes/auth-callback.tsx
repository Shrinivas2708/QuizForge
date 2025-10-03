import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

export const Route = createFileRoute('/auth-callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()
  const { setCurrentSessionId } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // The cookie is sent automatically by the browser
        const res = await authClient.getSession()

        if (res.data?.session?.token) {
          // Now we have the session token, save it to local storage
          setCurrentSessionId(res.data.session.token)
          toast.success('Logged in successfully!')
          // Redirect to the dashboard
          navigate({ to: '/dashboard', replace: true })
        } else {
          toast.error('Login failed. Could not retrieve session.')
          navigate({ to: '/login', replace: true })
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('An error occurred during login.')
        navigate({ to: '/login', replace: true })
      }
    }

    void handleAuthCallback()
  }, [navigate, setCurrentSessionId])

  return (
    <div className="flex-1 grid place-items-center p-4">
      <p>Please wait, we are logging you in...</p>
    </div>
  )
}