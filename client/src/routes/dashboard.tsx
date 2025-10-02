// import { Button } from '@/components/ui/button'
// import { useAuth } from '@/context/AuthContext'
import { useSession } from '@/lib/auth-client'
// import apiClient from '@/lib/axios'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
// import { AxiosError } from 'axios'
// import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

// function RouteComponent() {
//     const {user} = useAuth()
//     const navigate = useNavigate()
//    async function handleLogout(){
//         try {
//             await apiClient.post("/auth/sign-out")
//              toast.success("Signed out")
//              navigate({to:"/login"})

//         } catch (error) {
//             if(error instanceof AxiosError){
//                 return toast.error(error.response?.data.message)
//             }
//             toast.error("Failed to logout")
//         }
//     }
//   return <div>
//     {
//         user?.email
//     }
//     <Button variant={'outline'} className='text-red-400 border-red-400 bg-transparent' onClick={handleLogout}>
//         Logout
//         </Button>
//   </div>
// }

function RouteComponent(){
  const { data: session, isPending } = useSession();
  const nav = useNavigate()
  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return nav({to:"/"})
  }

  return <div>Welcome {session.user.name}!</div>;
}