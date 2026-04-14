import { createFileRoute } from '@tanstack/react-router'
const URL =  import.meta.env.VITE_ENV === "dev"
    ? "http://localhost:3000"
    : "https://quizforge.shribuilds.in/";

export const Route = createFileRoute('/')({
  beforeLoad:()=>{
    window.location.replace(URL)
  }
})

