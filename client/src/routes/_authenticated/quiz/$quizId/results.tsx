// client/src/routes/_authenticated/quiz/$quizId/results.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod"; // Import Zod

// Define the schema for the search parameters
const resultsSearchSchema = z.object({
  submissionId: z.string(),
});

export const Route = createFileRoute("/_authenticated/quiz/$quizId/results")({
  // Add the validation here
  validateSearch: (search) => resultsSearchSchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  // const { quizId } = Route.useParams();
  // Now you can safely get the submissionId without providing a generic type
  const { submissionId } = Route.useSearch();

  const { data: results, isLoading } = useQuery({
    queryKey: ["submission", submissionId, "results"],
    queryFn: async () => {
      const response = await apiClient.get(`/submissions/${submissionId}/results`);
      return response.data;
    },
    enabled: !!submissionId,
  });

  if (isLoading) {
    return <div className="grid place-items-center h-full"><Spinner /></div>;
  }

  if (!results) {
    return <div>Could not load results.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Quiz Results</CardTitle>
          <CardDescription>You Scored: <span className="text-2xl font-bold text-primary">{results.finalScore}%</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Answer Breakdown:</h3>
          // ... inside the RouteComponent return statement
{results.answers.map((result: any, index: number) => (
  <div key={result.question.id} className="border p-4 rounded-lg bg-muted/50">
    <div className="flex justify-between items-start">
      <p className="font-medium">{index + 1}. {result.question.questionText}</p>
      {/* Show correct/incorrect icon only if answered */}
      {result.givenAnswer !== null && (
        result.isCorrect 
          ? <CheckCircle className="text-green-500"/> 
          : <XCircle className="text-red-500"/>
      )}
    </div>
    <div className="text-sm mt-2 space-y-1">
      <p className={cn(
        "p-2 rounded",
        result.givenAnswer === null 
          ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 italic" 
          : !result.isCorrect && "bg-red-500/20 text-red-700 dark:text-red-300"
      )}>
        Your Answer: {result.givenAnswer ? JSON.stringify(result.givenAnswer) : "Unattempted"}
      </p>
      {/* Always show the correct answer */}
      <p className="p-2 rounded bg-green-500/20 text-green-700 dark:text-green-400">
        Correct Answer: {result.question.data.correctAnswer}
      </p>
      <p className="text-xs text-muted-foreground pt-2">
        Explanation: {result.question.feedback}
      </p>
    </div>
  </div>
))}
        </CardContent>
      </Card>
    </div>
  );
}