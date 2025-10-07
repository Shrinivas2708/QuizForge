import { createFileRoute, Link } from "@tanstack/react-router";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAttempts } from "@/hooks/getAttempts";

export const Route = createFileRoute("/_authenticated/quiz/$quizId/attempts")({
  component: AttemptsComponent,
});

function AttemptsComponent() {
  const { quizId } = Route.useParams();

  const { data: attempts, isLoading } = getAttempts(quizId)

  if (isLoading) {
    return <div className="grid h-full place-items-center"><Spinner /></div>;
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">No past attempts found for this quiz.</h2>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl"> Past Attempts</CardTitle>
          <CardDescription>Review your previous results for this quiz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {attempts.map((attempt: any) => (
            <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="font-semibold">Attempt #{attempt.attemptNumber}</p>
 {attempt.disqualified ? (
      <div>
        <Badge variant="destructive">Disqualified</Badge>
        <p className="text-red-500 text-sm">{attempt.disqualificationReason}</p>
      </div>
    ) : (
      <p>Score: {attempt.finalScore}%</p>
    )}
                <p className="text-sm text-muted-foreground">
                  Completed on: {new Date(attempt.completedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{attempt.finalScore}%</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/quiz/$quizId/results" params={{ quizId }} search={{ submissionId: attempt.id }}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}