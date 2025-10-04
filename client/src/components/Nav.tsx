import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ThemeButton } from "./toggle-theme";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming you have an Avatar component

export default function Nav() {
  
    const routerState = useRouterState()
  
  const isAuthenticatedRoute =
    routerState.location.pathname.startsWith('/_authenticated') ||
    routerState.matches.some((match) =>
      match.routeId.includes('/_authenticated'),
    )
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate()
  return (
    <div className={`w-full  py-3 px-5 flex justify-between items-center ${isAuthenticatedRoute ? "":"border-b" }`}>
      <Link to="/">
        <p className="font-logo text-2xl font-extrabold cursor-pointer hover:text-foreground/80">
          QuizForge
        </p>
      </Link>
      <div className="flex gap-3 items-center">
        <ThemeButton/>
        {isLoading ? (
          <div className="w-24 h-9 bg-muted animate-pulse rounded-md" /> // Loading skeleton
        ) : isAuthenticated && user ? (
          // You can create a dropdown menu for profile/logout here
          <Avatar onClick={
            ()=>{
              navigate({to:"/profile"})
            }
          }
          className="cursor-pointer size-9"
          >
            <AvatarImage src={user.image || ''} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <>
            <Link to="/login">
              <Button variant={'outline'} className="cursor-pointer">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="cursor-pointer">Get Started</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}