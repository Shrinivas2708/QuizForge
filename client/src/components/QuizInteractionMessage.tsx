// components/QuizGeneratedMessage.tsx
import { Button } from "./ui/button";
import { PlayCircle, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useGenerateQuiz } from "../hooks/useGenerateQuiz";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/axios";
import { Badge } from "./ui/badge";
import { Spinner } from "./ui/spinner";

interface QuizGeneratedMessageProps {
  quizId: string;
  title: string;
  questionCount: number;
  sourceId: string;
  sessionId: string;
}

export const QuizGeneratedMessage = ({
  quizId,
  title,
  questionCount,
  sourceId,
  sessionId,
}: QuizGeneratedMessageProps) => {
  const navigate = useNavigate();
  const regenerateQuiz = useGenerateQuiz({
    onSuccess() {},
  });

  // 1. Fetch the attempt count for this specific quiz
  const { data: attemptsData, isLoading: isLoadingAttempts } = useQuery<{
    count: number;
  }>({
    queryKey: ["quiz", quizId, "attempts-count"],
    queryFn: async () => {
      const response = await apiClient.get(
        `/quizzes/${quizId}/my-attempts/count`,
      );
      return response.data;
    },
  });

  const attemptCount = attemptsData?.count || 0;

  const handleStartQuiz = () => {
    navigate({
      to: "/quiz/$quizId/take",
      params: { quizId },
    });
  };

  const handleRegenerate = () => {
    regenerateQuiz.mutate({
      sourceId,
      sessionId,
      title,
      config: {
        difficulty: "medium",
        questionCount: 10,
        questionTypes: ["multiple_choice", "true_false"],
      },
    });
  };

  return (
    <div className="from-primary/5 to-primary/10 space-y-4 rounded-lg border bg-gradient-to-br p-6">
           {" "}
      <div>
                <h3 className="text-lg font-semibold">Quiz Ready!</h3>       {" "}
        <p className="text-muted-foreground text-sm">
                    {title} • {questionCount} questions        {" "}
        </p>
             {" "}
      </div>
      {/* 2. Display the attempt count below the title */}
      <div>
        {isLoadingAttempts ? (
          <Spinner />
        ) : (
          <div className="flex gap-2">
            <Badge variant="outline">
              {attemptCount} {attemptCount === 1 ? "Attempt" : "Attempts"} Taken
            </Badge>
            <Link to="/quiz/$quizId/attempts" params={{ quizId }}>
              <p className="hover:underline"> See Attempts</p>
            </Link>
          </div>
        )}
      </div>
           {" "}
      <div className="flex flex-wrap gap-2">
               {" "}
        <Button onClick={handleStartQuiz} className="flex-1" size="lg"><PlayCircle className="mr-2 size-4" />Start Quiz  
               
        </Button>
               {" "}
        <Button
          onClick={handleRegenerate}
          variant="outline"
          size="lg"
          disabled={regenerateQuiz.isPending}
        >
                   {" "}
          <RefreshCw
            className={`size-4 ${regenerateQuiz.isPending ? "animate-spin" : ""}`}
          />
                 {" "}
        </Button>
             {" "}
      </div>
         
    </div>
  );
};
