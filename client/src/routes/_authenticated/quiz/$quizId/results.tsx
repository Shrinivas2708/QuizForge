// client/src/routes/_authenticated/quiz/$quizId/results.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod"; // Import Zod
import { getAttempts } from "@/hooks/getAttempts";

// Define the schema for the search parameters
const resultsSearchSchema = z.object({
  submissionId: z.string(),
});

export const Route = createFileRoute("/_authenticated/quiz/$quizId/results")({
  // Add the validation here
  validateSearch: (search) => resultsSearchSchema.parse(search),
  component: RouteComponent,
});

type AttemptData = {
  id: string;
  finalScore: number | null;
  completedAt: Date | null;
  attemptNumber: number | null;
  disqualified: boolean | null;
  disqualificationReason: string | null;
}[];
function RouteComponent() {
  // const { quizId } = Route.useParams();
  // Now you can safely get the submissionId without providing a generic type
  const { submissionId } = Route.useSearch();
  const { quizId } = Route.useParams();
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData([
    "quiz",
    quizId,
    "my-attempts",
  ]) as AttemptData;
  if (!data) {
    getAttempts(quizId);
    return (
      <div className="flex items-center justify-center gap-2">
        <Spinner />
      </div>
    );
  }
  console.log(data);
  const { data: results, isLoading } = useQuery({
    queryKey: ["submission", submissionId, "results"],
    queryFn: async () => {
      const response = await apiClient.get(
        `/submissions/${submissionId}/results`,
      );
      return response.data;
    },
    enabled: !!submissionId,
  });

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!results) {
    return <div>Could not load results.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Quiz Results</CardTitle>
          <CardDescription>
            You Scored:
            <span className="text-primary text-2xl font-bold">
              {results.finalScore}%
            </span>
          </CardDescription>
        </CardHeader>
        {data[0].disqualified ? (
         <CardContent>
         <p className="text-red-500/50"> {data[0].disqualificationReason} That's why you have been disqualified!</p>
         </CardContent>
        ) : (
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Answer Breakdown:</h3>
            {results.answers.map((result: any, index: number) => (
              <div
                key={result.question.id}
                className="bg-muted/50 rounded-lg border p-4"
              >
                   
                <div className="flex items-start justify-between">
                       
                  <p className="font-medium">
                    {index + 1}. {result.question.questionText}
                  </p>
                        {/* Show correct/incorrect icon only if answered */}   
                   
                  {result.givenAnswer !== null &&
                    (result.isCorrect ? (
                      <CheckCircle className="text-green-500" />
                    ) : (
                      <XCircle className="text-red-500" />
                    ))}
                     
                </div>
                   
                <div className="mt-2 space-y-1 text-sm">
                       
                  <p
                    className={cn(
                      "rounded p-2",
                      result.givenAnswer === null
                        ? "bg-yellow-500/20 text-yellow-700 italic dark:text-yellow-300"
                        : !result.isCorrect &&
                            "bg-red-500/20 text-red-700 dark:text-red-300",
                    )}
                  >
                            Your Answer:
                    {result.givenAnswer
                      ? JSON.stringify(result.givenAnswer)
                      : "Unattempted"}
                         
                  </p>
                        {/* Always show the correct answer */}     
                  <p className="rounded bg-green-500/20 p-2 text-green-700 dark:text-green-400">
                            Correct Answer: {result.question.data.correctAnswer}
                         
                  </p>
                       
                  <p className="text-muted-foreground pt-2 text-xs">
                            Explanation: {result.question.feedback}     
                  </p>
                     
                </div>
                 
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
