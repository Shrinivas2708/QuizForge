import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../lib/axios";
import { Spinner } from "./ui/spinner";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface RoomQuizTakerProps {
  participantId: string;
  shareableCode: string;
  quizId: string;
}

interface Question {
  id: string;
  questionType: "multiple_choice" | "true_false" | "short_answer";
  questionText: string;
  data: {
    options?: string[];
  };
}

interface QuizData {
  title: string;
  questions: Question[];
}

export function RoomQuizTaker({
  participantId,
  shareableCode,
}: RoomQuizTakerProps) {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFullScreen, setIsFullScreen] = useState(
    document.fullscreenElement != null
  );
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startSubmissionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/rooms/${shareableCode}/start`, {
        participantId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSubmissionId(data.submission.id);
      setQuizData({
        title: "Quiz", // You can enhance this by fetching quiz title
        questions: data.questions,
      });
      handleStartQuiz();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Could not start the quiz session."
      );
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({
      questionId,
      givenAnswer,
    }: {
      questionId: string;
      givenAnswer: string;
    }) => {
      if (!submissionId) throw new Error("Submission not started");
      return apiClient.post(`/submissions/${submissionId}/answer`, {
        questionId,
        givenAnswer,
        participantId,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to save answer");
    },
  });

  const finishSubmissionMutation = useMutation({
    mutationFn: async () => {
      if (!submissionId) throw new Error("Submission not started");
      return apiClient.post(`/submissions/${submissionId}/finish`, {
        participantId,
      });
    },
    onSuccess: () => {
      toast.success("Quiz submitted successfully!");
      // Exit fullscreen and navigate home
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      navigate({ to: "/" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to submit quiz.");
    },
  });

  // Timer effect
  useEffect(() => {
    if (!submissionId) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [submissionId]);

  // Proctoring effects (fullscreen, visibility, copy/paste)
  // Proctoring effects (fullscreen, visibility, copy/paste, right-click, PrintScreen)
  useEffect(() => {
    if (!submissionId) return;

    const proctoringEvent = async (eventType: string) => {
      try {
        const response = await apiClient.post(
          `/submissions/${submissionId}/proctoring`,
          {
            eventType,
            participantId,
            details: { timestamp: new Date().toISOString() },
          }
        );

        if (response.data.disqualified) {
          toast.error(`Disqualified: ${response.data.reason}`);
          finishSubmissionMutation.mutate();
        }
      } catch (error) {
        console.error("Proctoring error:", error);
      }
    };

    // Fullscreen exit
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        toast.warning("You have exited fullscreen mode!");
        proctoringEvent("fullscreen_exit");
      } else {
        setIsFullScreen(true);
      }
    };

    // Tab/window switch
    const handleTabSwitch = () => {
      toast.warning("Tab/window switch detected!");
      proctoringEvent("tab_switch");
    };
    const handleVisibilityChange = () => {
      if (document.hidden) handleTabSwitch();
    };

    // Copy/paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning("Copying is disabled during the quiz.");
      proctoringEvent("copy_paste");
    };

    // Right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("Right-click is disabled during the quiz.");
      proctoringEvent("right_click");
    };

    // PrintScreen
    const handlePrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        toast.error("PrintScreen detected!");
        proctoringEvent("copy_paste");
      }
    };

    // Add event listeners
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleTabSwitch);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keyup", handlePrintScreen);

    // Cleanup
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleTabSwitch);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keyup", handlePrintScreen);
    };
  }, [submissionId, participantId, finishSubmissionMutation]);

  const handleStartQuiz = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      toast.error("Failed to enter fullscreen mode.");
    }
  };

  const handleAnswer = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      if (submissionId) {
        submitAnswerMutation.mutate({ questionId, givenAnswer: answer });
      }
    },
    [submissionId, submitAnswerMutation]
  );

  const handleNextQuestion = useCallback(() => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [quizData, currentQuestionIndex]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(() => {
    finishSubmissionMutation.mutate();
  }, [finishSubmissionMutation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (!quizData || !submissionId) {
    return (
      <div className="mx-auto flex h-screen max-w-2xl flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-3xl font-bold">Ready to Start?</h1>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quiz must be taken in fullscreen mode. Exiting fullscreen may
            result in disqualification.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => startSubmissionMutation.mutate()}
          disabled={startSubmissionMutation.isPending}
          size="lg"
        >
          {startSubmissionMutation.isPending ? <Spinner /> : "Start Quiz"}
        </Button>
      </div>
    );
  }
  const currentQuestion = quizData.questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="grid h-full place-items-center">Question not found.</div>
    );
  }
  if (!isFullScreen) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-3xl font-bold">{quizData.title}</h1>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quiz must be taken in fullscreen mode to ensure a focused
            environment. Exiting fullscreen during the quiz may result in
            disqualification.
          </AlertDescription>
        </Alert>
        <div className="mb-6 w-full space-y-2 text-left">
          <p className="flex items-center gap-2">
            <span className="font-medium">Questions:</span>{" "}
            {quizData.questions.length}
          </p>
        </div>
        <Button
          onClick={handleStartQuiz} // <--- CHANGE THIS
          size="lg"
        >
          Re-enter Fullscreen {/* <--- CHANGE THIS */}
        </Button>
      </div>
    );
  }
  return (
    <div className="p-4 md:p-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{quizData.title}</CardTitle>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(elapsedTime)}
              </span>
              <span>
                Question {currentQuestionIndex + 1} of{" "}
                {quizData.questions.length}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <div className="bg-secondary h-2 w-full rounded-full">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${
                    (getAnsweredCount() / quizData.questions.length) * 100
                  }%`,
                }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {getAnsweredCount()} of {quizData.questions.length} answered
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-lg font-medium">
            {currentQuestion.questionText}
          </p>
          <div className="flex flex-col gap-3">
            {currentQuestion.questionType === "true_false" ? (
              <>
                <Button
                  variant={
                    answers[currentQuestion.id] === "True"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleAnswer(currentQuestion.id, "True")}
                  className="h-auto py-3"
                >
                  True
                </Button>
                <Button
                  variant={
                    answers[currentQuestion.id] === "False"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleAnswer(currentQuestion.id, "False")}
                  className="h-auto py-3"
                >
                  False
                </Button>
              </>
            ) : (
              currentQuestion.data?.options?.map((option: string) => (
                <Button
                  key={option}
                  variant={
                    answers[currentQuestion.id] === option
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                  className="h-auto min-h-12 justify-start py-3 text-left whitespace-normal"
                >
                  {option}
                </Button>
              ))
            )}
          </div>
          <div className="mt-8 flex justify-between gap-2">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>
            {currentQuestionIndex === quizData.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={finishSubmissionMutation.isPending}
              >
                {finishSubmissionMutation.isPending ? (
                  <Spinner />
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>Next</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
