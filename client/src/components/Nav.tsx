
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ThemeButton } from "./toggle-theme";

export default function Nav() {
  return (
    <div className="w-full border-b py-3 px-5 flex justify-between items-center">
      <Link to="/">
      <p className="font-logo text-2xl font-extrabold cursor-pointer hover:text-foreground/80">
        QuizForge
      </p>
      </Link>
      <div className="flex gap-3">
        <ThemeButton/>
        <Link to="/login">
        <Button variant={'outline'} className="cursor-pointer">Login</Button>
        </Link>
        <Link to="/signup">
        <Button className="cursor-pointer">Get Started</Button>
        </Link>
        
      </div>
    </div>
  )
}