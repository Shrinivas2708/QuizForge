// client/src/routes/auth-callback.tsx

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { z } from 'zod' // 👈 1. Import Zod

// 👇 2. Define and validate the expected search parameters
const authCallbackSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/auth-callback')({
  // Add the validator here
  validateSearch: (search) => authCallbackSearchSchema.parse(search),
  component: AuthCallback,
})

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function AuthCallback() {
  const navigate = useNavigate()
  const { setCurrentSessionId } = useAuth()
  
  // The 'token' property will now be correctly typed and recognized
  const { token } = useSearch({ from: '/auth-callback' })

  useEffect(() => {
    const handleCallback = async () => {
      console.log("✅ [CLIENT] Reached /auth-callback route.");

      if (token) {
        console.log(`✅ [CLIENT] Token received from URL: ${token}`);
        
        setCurrentSessionId(token);
        console.log("✅ [CLIENT] currentSessionId set in AuthContext and localStorage.");
        
        toast.success('Logged in successfully with Google!');

        await sleep(50);

        console.log("✅ [CLIENT] Navigating to /dashboard.");
        navigate({ to: '/dashboard', replace: true });

      } else {
        console.error("❌ [CLIENT] No token found in URL search parameters.");
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