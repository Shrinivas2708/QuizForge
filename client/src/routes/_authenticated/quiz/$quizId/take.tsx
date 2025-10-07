// client/src/routes/_authenticated/quiz/$quizId/take.tsx

import { createFileRoute } from "@tanstack/react-router";
import { QuizTakingScreen } from "@/components/QuizTakingScreen";

export const Route = createFileRoute("/_authenticated/quiz/$quizId/take")({
  component: RouteComponent,
});

function RouteComponent() {
  const { quizId } = Route.useParams();
  return <QuizTakingScreen quizId={quizId} />;
}