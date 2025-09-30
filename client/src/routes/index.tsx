import Feature from '@/components/landing/Feature'
import FinalCTA from '@/components/landing/FinalCTA'
import Home from '@/components/landing/Home'
import Works from '@/components/landing/Works'
import { ThemeButton } from '@/components/toggle-theme'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <section className='relative w-full min-h-screen'>
    <ThemeButton />
      <Home />
      {/* Future add Social Proff */}
      <Works />
      <Feature />
      <FinalCTA/>
    </section>
  )
}