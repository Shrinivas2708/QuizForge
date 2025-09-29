import { ThemeButton } from '@/components/toggle-theme'
import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return <div className='w-full border p-3 flex justify-between'>
    <Button>
      Click
    </Button>
    <ThemeButton/>
    
  </div>
}
