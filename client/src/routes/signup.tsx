import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

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
import {  useForm } from '@tanstack/react-form'
import { AxiosError } from 'axios'
import z from 'zod'
import { CALLBACK_URL } from '@/lib/exports'
import { signIn, signUp } from '@/lib/auth-client'
export const Route = createFileRoute('/signup')({
  component: Signup,
})

function Signup() {
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const res = await signUp.email(value)
                
                if (res.data?.token) {
                  toast.success('Signed up successfully!')
                  navigate({ to: '/dashboard' })
                } else {
                  toast.error(`Signup failed.${res.error?.message}`)
                }
      } catch (error) {
        if (error instanceof AxiosError) {
          return toast.error(error.response?.data.message)
        }
        console.error('Signup error:', error)
        toast.error('Signup failed. Please check your credentials.')
      }
    },
  })

  const handleGoogleLogin = async () => {
  try {
   await signIn.social({
      provider: 'google',
      callbackURL: CALLBACK_URL
    });
  } catch (error) {
    console.error('Google login failed:', error);
    toast.error('Could not initiate Google login.');
  }
};

  return (
    // The change is in this line 👇
    <div className="flex-1 grid place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Enter all the details to crate an account
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
                name="name"
                validators={{
                  onBlur: ({ value }) => {
                    const result = z
                      .string()
                      .min(4, 'Min 4 letters are required')
                      .max(10, 'Max 10 lettrs are required')
                      .safeParse(value)
                    if (!result.success) {
                      return result.error.errors[0].message
                    }
                    return undefined
                  },
                }}
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="text"
                      placeholder="john"
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
            <Button
              type="submit"
              className="w-full"
              onClick={() => toast.success('logged in!')}
            >
              Signup
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              Signup with Google
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
