import { ThemeButton } from '@/components/toggle-theme'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div>
      <ThemeButton />
    </div>
   )
}
