import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { authClient } from '@/lib/auth-client'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { BadgeCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import * as UAParser from 'ua-parser-js'
import { Monitor, Smartphone, Tablet, Server, Apple } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQueryClient } from '@tanstack/react-query'
import { useSessions } from '@/hooks/useSessions'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/_authenticated/profile')({
  component: RouteComponent,
})



function RouteComponent() {
  const { user, isLoading, currentSessionId, setCurrentSessionId, refetch } =
    useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    data: sessions,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useSessions()
  async function handleLogout() {
    try {
      await authClient.signOut()
      setCurrentSessionId(null)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      // Refetch auth state to update context
      await refetch()

      toast.success('Signed out')

      // Force router to re-evaluate routes
      router.invalidate()

      // Small delay to ensure state updates propagate
      setTimeout(() => {
        router.navigate({ to: '/' })
      }, 100)
    } catch (error) {
      if (error instanceof AxiosError) {
        return toast.error(error.response?.data.message)
      }
      toast.error('Failed to logout')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  }

  if (!user) {
    return null // Let the _authenticated layout handle redirect
  }

  function getDateTime(d: Date) {
    const date = new Date(d)
    const datePart = date.toLocaleDateString()
    const timePart = date.toLocaleTimeString()
    return `${datePart} ${timePart}`
  }

  function checkActive(expiresAt: Date) {
    const current = new Date()
    const expireDate = new Date(expiresAt)
    return current < expireDate
  }

  function getIcon(device: string, browser?: string) {
    device = device.toLowerCase()
    browser = browser?.toLowerCase() || ''

    if (device === 'api client' || /postman|curl|http/i.test(browser)) {
      return <Server size={20} />
    }

    if (device.includes('iphone') || device.includes('mobile')) {
      return <Smartphone size={20} />
    }

    if (device.includes('ipad') || device.includes('tablet')) {
      return <Tablet size={20} />
    }

    if (device.includes('mac')) {
      return <Apple size={20} />
    }

    return <Monitor size={20} />
  }

  function parseUserAgent(ua: string) {
    const parser = new UAParser.UAParser(ua)
    const result = parser.getResult()
    const isApiClient = /postman|curl|http/i.test(ua)

    const browser = isApiClient ? ua : result.browser.name || 'Unknown'
    const os = isApiClient ? 'Unknown' : result.os.name || 'Unknown'
    const device = isApiClient
      ? 'API Client'
      : result.device.model || result.device.type || 'Desktop'

    return {
      browser,
      os,
      device,
      icon: getIcon(device, browser),
    }
  }

  async function handleSessionRevoke(id: string) {
    try {
      const res = await authClient.revokeSession({
        token: id,
      })

      if (id === currentSessionId) {
        setCurrentSessionId(null)
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        await refetch()
        router.invalidate()
        setTimeout(() => {
          router.navigate({ to: '/' })
        }, 100)
        return
      }

      if (res.data?.status) {
        refetchSession()
        return toast.success('Session revoked successfully')
      }

      toast.error(res.error?.message)
    } catch (error) {
      console.log(error)
    }
  }

  async function handleSessionRevokeAll() {
    const res = await authClient.revokeOtherSessions()
    if (res.data?.status) {
      refetchSession()
      return toast.success('Revoked all other sessions successfully')
    }
    toast.error(res.error?.message)
  }

  async function RevokeAllSession() {
    const res = await authClient.revokeSessions()
    if (res.data?.status) {
      setCurrentSessionId(null)
      await refetch()
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      toast.success('Revoked all sessions successfully')
      router.invalidate()
      setTimeout(() => {
        router.navigate({ to: '/' })
      }, 100)
    } else {
      toast.error(res.error?.message)
    }
  }

  return (
    <div className="flex-1 p-4">
      <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto">
        <Card className="w-full h-fit lg:max-w-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-3">
              <Avatar className="size-16">
                <AvatarImage src={user.image || ''} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-base space-y-1">
                <div>
                  <p>{user.name}</p>
                  <p>{user.email}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <BadgeCheckIcon color="green" />
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
            <div className="text-sm flex justify-between px-2">
              <div>
                <span className="text-foreground">Created at:</span>
                <p className="text-xs">{getDateTime(user.createdAt)}</p>
              </div>
              <div>
                <span className="text-foreground">Updated at:</span>
                <p className="text-xs">{getDateTime(user.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={'outline'}
                  className="text-red-400 border-red-400 bg-transparent dark:bg-transparent dark:border-red-400 dark:hover:text-red-400 dark:hover:bg-transparent cursor-pointer hover:text-red-400 hover:bg-transparent"
                >
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Log out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card className="w-full flex-1">
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              This is a list of devices that have logged into your account.
              Revoke any sessions that you do not recognize.
            </CardDescription>
          </CardHeader>
          {sessionLoading ? <div className='flex-1 place-items-center'><Spinner/></div> : 
          <ScrollArea className="h-[450px]">
            <CardContent className="space-y-2">
              {sessions?.map((v, i) => {
                const uaInfo = parseUserAgent(v.userAgent!)
                const isActive = checkActive(v.expiresAt!)
                const isCurrent = v.token === currentSessionId

                return (
                  <Card
                    key={i}
                    className={isCurrent ? 'border-green-400/60' : ''}
                  >
                    <CardContent className="text-sm space-y-1 pt-4">
                      <div className="flex gap-2 items-center">
                        {uaInfo.icon}
                        <p className="font-semibold text-base">
                          {uaInfo.device}
                        </p>
                        <Badge
                          variant={'outline'}
                          className={
                            isActive ? 'text-green-400 border-green-400/60' : ''
                          }
                        >
                          {isActive ? 'Active' : 'Expired'}
                        </Badge>
                      </div>

                      {v.ipAddress && <p>IP: {v.ipAddress}</p>}

                      {isCurrent ? (
                        <p>Current Session</p>
                      ) : (
                        <p>
                          Last accessed on:{' '}
                          {new Date(v.updatedAt).toLocaleString()}
                        </p>
                      )}

                      <p>
                        {uaInfo.browser} on {uaInfo.os}
                      </p>

                      <p>
                        Signed in on: {new Date(v.createdAt).toLocaleString()}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        size={'sm'}
                        variant={'outline'}
                        className="text-red-400 border-red-400 bg-transparent dark:bg-transparent dark:border-red-400 dark:hover:text-red-400 dark:hover:bg-transparent cursor-pointer hover:text-red-400 hover:bg-transparent"
                        onClick={() => handleSessionRevoke(v.token)}
                      >
                        Revoke Session
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </CardContent>
          </ScrollArea>
}
          <CardFooter className="flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={'outline'}
                  className="text-red-400 border-red-400 bg-transparent dark:bg-transparent dark:border-red-400 dark:hover:text-red-400 dark:hover:bg-transparent cursor-pointer hover:text-red-400 hover:bg-transparent"
                >
                  Revoke all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to revoke sessions?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSessionRevokeAll}
                    className="text-red-400 border-red-400 bg-transparent dark:bg-transparent dark:border-red-400 dark:hover:text-red-400 dark:hover:bg-transparent cursor-pointer hover:text-red-400 hover:bg-transparent ring-1"
                  >
                    Revoke all others
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={RevokeAllSession}
                    className="text-red-400 border-red-400 bg-transparent dark:bg-transparent dark:border-red-400 dark:hover:text-red-400 dark:hover:bg-transparent cursor-pointer hover:text-red-400 hover:bg-transparent ring-1"
                  >
                    Revoke all (including current)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
