import { GithubIcon } from "lucide-react";
import { Button } from "../ui/button";

export default function Home() {
  return (
    <section className="flex flex-col justify-center items-center gap-7">
      <p className=" text-center text-5xl font-bold mt-[6rem]  ">
        From Syllabus to Quiz in Seconds
      </p>
      <p className="text-center   max-w-2xl mx-auto text-xl">
        An intelligent, AI-driven platform that transforms any syllabus into a
        comprehensive and interactive quiz.
      </p>
      <div className="space-x-5 flex">
        <Button>Get Started</Button>
        <Button
          variant={'link'}
          className="dark:text-primary-foreground text-foreground"
        >
          <GithubIcon />
          Contribute to github
        </Button>
      </div>
    </section>
  )
}