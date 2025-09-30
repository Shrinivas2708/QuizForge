
import { Button } from "./ui/button";

export default function Nav() {
  return (
    <div className="w-full border-b py-3 px-5 flex justify-between items-center">
      <p className="font-logo text-2xl font-extrabold cursor-pointer hover:text-foreground/80">
        QuizForge
      </p>
      <div className="flex gap-3">
        <Button variant={'outline'}>Login</Button>
        <Button>Get Started</Button>
        
      </div>
    </div>
  )
}