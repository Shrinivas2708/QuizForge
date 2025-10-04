import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { z } from 'zod' 

const authCallbackSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/auth-callback')({
  validateSearch: (search) => authCallbackSearchSchema.parse(search),
  component: AuthCallback,
})

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function AuthCallback() {
  const navigate = useNavigate()
  const { setCurrentSessionId } = useAuth()
  const { token } = useSearch({ from: '/auth-callback' })

  useEffect(() => {
    const handleCallback = async () => {

      if (token) {
        
        setCurrentSessionId(token);
        toast.success('Logged in successfully with Google!');

        await sleep(50);

        navigate({ to: '/profile', replace: true });

      } else {
        toast.error('Google login failed. Could not retrieve session token.')
        navigate({ to: '/login', replace: true });
      }
    };

    void handleCallback();
  }, [token, navigate, setCurrentSessionId]);

  return (
    <div className="flex-1 grid place-items-center p-4">
      <p>Finalizing your login, please wait...</p>
    </div>
  )
}