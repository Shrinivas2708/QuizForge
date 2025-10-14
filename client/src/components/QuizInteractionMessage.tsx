// client/src/components/QuizInteractionMessage.tsx

import { Button } from "./ui/button";
import { PlayCircle, RefreshCw, DoorOpen } from "lucide-react"; // Import DoorOpen
import { Link, useNavigate } from "@tanstack/react-router";
import { useGenerateQuiz } from "../hooks/useGenerateQuiz";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/axios";
import { Badge } from "./ui/badge";
import { Spinner } from "./ui/spinner";
import { CreateRoomDialog } from "./CreateRoomDialog"; // Import the new dialog
import { useEffect, useState } from "react";

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
  const [hasActiveRoom, setHasActiveRoom] = useState(false);

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

  const { data: roomData } = useQuery({
    queryKey: ["room", quizId, "status"],
    queryFn: async () => {
      // This endpoint doesn't exist yet, we'll assume it will for now
      try {
        const response = await apiClient.get(`/rooms/${quizId}/status`);
        return response.data;
      } catch (error) {
        return null;
      }
    },
  });

  useEffect(() => {
    if (roomData) {
      setHasActiveRoom(true);
    }
  }, [roomData]);

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
      <div>
        <h3 className="text-lg font-semibold">Quiz Ready!</h3>
        <p className="text-muted-foreground text-sm">
          {title} • {questionCount} questions
        </p>
      </div>

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
            {hasActiveRoom && (
              <Badge variant="secondary">
                <DoorOpen className="mr-1 h-3 w-3" />
                Active Room
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleStartQuiz} className="flex-1" size="lg">
          <PlayCircle className="mr-2 size-4" />
          Start Quiz
        </Button>
        <Button
          onClick={handleRegenerate}
          variant="outline"
          size="lg"
          disabled={regenerateQuiz.isPending}
        >
          <RefreshCw
            className={`size-4 ${regenerateQuiz.isPending ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div>
        <CreateRoomDialog quizId={quizId}>
          <Button className="w-full">Create Room</Button>
        </CreateRoomDialog>
      </div>
    </div>
  );
};