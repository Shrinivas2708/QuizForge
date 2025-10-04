import Feature from '@/components/landing/Feature'
import FinalCTA from '@/components/landing/FinalCTA'
import Home from '@/components/landing/Home'
import Works from '@/components/landing/Works'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) {
      return
    }
    
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/new' })
    }
  },
  component: Landing,
})

function Landing() {
  return (
    <section className='relative w-full min-h-screen'>
      <Home />
      <Works />
      <Feature />
      <FinalCTA/>
    </section>
  )
}