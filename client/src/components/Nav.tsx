import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ThemeButton } from "./toggle-theme";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sidebarRoutes } from "@/lib/exports";

export default function Nav() {
  const routerState = useRouterState();

  const isAuthenticatedRoute = sidebarRoutes.some((route) =>
    routerState.location.pathname.startsWith(route),
  );

  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  return (
    <div
      className={`flex w-full items-center px-5 py-3 ${isAuthenticatedRoute ? "justify-end" : "justify-between border-b"}`}
    >
      {isAuthenticatedRoute ? (
        ""
      ) : (
        <Link to="/">
          <p className="font-logo hover:text-foreground/80 cursor-pointer text-2xl font-extrabold">
            QuizForge
          </p>
        </Link>
      )}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="bg-muted h-9 w-24 animate-pulse rounded-md" /> // Loading skeleton
        ) : isAuthenticated && user ? (
          <>
            <Link to="/rooms">
              <Button variant={"ghost"} className="cursor-pointer">
                Rooms
              </Button>
            </Link>
            <Avatar
              onClick={() => {
                navigate({ to: "/profile" });
              }}
              className="size-9 cursor-pointer"
            >
              <AvatarImage src={user.image || ""} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button variant={"outline"} className="cursor-pointer">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="cursor-pointer">Get Started</Button>
            </Link>
          </>
        )}
        <ThemeButton />
        
      </div>
    </div>
  );
}