import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/quiz/$quizId/take')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/quiz/$quizId/take"!</div>
}
