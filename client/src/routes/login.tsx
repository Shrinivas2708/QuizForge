import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import z from "zod"
import { AxiosError } from 'axios'
// import { CALLBACK_URL } from '@/lib/exports'
import {   handleGoogleLogin, signIn } from '@/lib/auth-client'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  
 beforeLoad: ({ context }) => {
   
    if (context.auth.isLoading) {
      return
    }
    
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/new" })
    }
  },
  component: Login,
})


function Login() {
  const navigate = useNavigate()
  const { setCurrentSessionId,refetch,isLoading,isAuthenticated } = useAuth()
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: '/new', replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const res = await signIn.email(value)
        
        if (res.data?.token) {
          setCurrentSessionId(res.data.token)
          await refetch()
          toast.success('Logged in successfully!')
          setTimeout(() => {
            
      navigate({ to: '/new', replace: true })
        }, 100)
        } else {
          toast.error(`Login failed.${res.error?.message}`)
        }
      } catch (error) {
        if(error instanceof AxiosError) {
         return toast.error(error.response?.data.message)
        }
        console.error('Login error:', error)
        toast.error('Login failed. Please check your credentials.')
      }
    },
  })



  
  // If authenticated, show nothing (redirect happening)
  if (isAuthenticated) {
    return null
  }
  
  return (
    <div className="flex-1 grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <CardContent>
            <div className="flex flex-col gap-6">
              <form.Field
                name="email"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z
                      .string()
                      .min(1, 'Email is required')
                      .email('Must be a valid email')
                      .safeParse(value)
                    
                    if (!result.success) {
                      return result.error.errors[0].message
                    }
                    return undefined
                  },
                }}
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="email"
                      placeholder="m@example.com"
                    />
                    {field.state.meta.errors.length > 0 ? (
                      <em role="alert" className="text-sm text-destructive">
                        {field.state.meta.errors.join(', ')}
                      </em>
                    ) : null}
                  </div>
                )}
              />
              <form.Field
                name="password"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z
                      .string()
                      .min(1, 'Password is required')
                      .safeParse(value)
                    
                    if (!result.success) {
                      return result.error.errors[0].message
                    }
                    return undefined
                  },
                }}
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Password</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="password"
                      placeholder="**********"
                    />
                    {field.state.meta.errors.length > 0 ? (
                      <em role="alert" className="text-sm text-destructive">
                        {field.state.meta.errors.join(', ')}
                      </em>
                    ) : null}
                  </div>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 mt-5">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                  }}
                  className="w-full" 
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              )}
            />
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleGoogleLogin}
            >
              Login with Google
            </Button>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}