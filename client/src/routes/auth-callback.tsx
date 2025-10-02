import apiClient from '@/lib/axios';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth-callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async () => {
      try {
        console.log('AuthCallback: Starting auth completion...');
        
        // Wait a bit for the cookie to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to get the session from better-auth
        const sessionResponse = await apiClient.get('/auth/get-session');
        console.log('Session response:', sessionResponse.data);
        
        if (sessionResponse.data?.session || sessionResponse.data?.user) {
          // Session exists, now verify with /users/me
          const userResponse = await apiClient.get('/users/me');
          console.log('User data:', userResponse.data);
          
          if (userResponse.data) {
            toast.success('Login successful!');
            navigate({to:"/dashboard",replace:true});
          } else {
            throw new Error('No user data returned');
          }
        } else {
          throw new Error('No session found');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        const errorMessage = error.response?.data?.message || 'Authentication failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate({to:"/login",replace:true});
        }, 2000);
      }
    };

    completeAuth();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-400 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
}
