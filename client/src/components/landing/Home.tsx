import { GithubIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Link } from '@tanstack/react-router'

export default function Home() {
  return (
    <section className="flex flex-col justify-center items-center gap-7 text-center px-4">
      <p className="text-5xl font-bold mt-[6rem]">
        From Syllabus to Quiz in Seconds
      </p>
      <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
        An intelligent, AI-driven platform that transforms any syllabus into a
        comprehensive and interactive quiz.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link to="/signup"><Button size="lg">Get Started</Button></Link>
        <Button
          variant={'link'}
          size="lg"
          className="dark:text-primary-foreground text-foreground"
          asChild
        >
          <a
            href="https://github.com/shrinivas2708/quizforge"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon  />
            Contribute
            on GitHub
          </a>
        </Button>
      </div>
    </section>
  )
}