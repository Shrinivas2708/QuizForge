// client/src/components/QuizTakingScreen.tsx - Fixed version

import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Spinner } from "./ui/spinner";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface QuizTakingScreenProps {
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
  id: string;
  title: string;
  questions: Question[];
}

interface Submission {
  id: string;
  participantId: string;
  quizId: string;
  startedAt: string;
}

export function QuizTakingScreen({ quizId }: QuizTakingScreenProps) {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch quiz data
  const { data: quizData, isLoading } = useQuery<QuizData>({
    queryKey: ["quiz", quizId, "take"],
    queryFn: async () => {
      const response = await apiClient.get(`/quizzes/${quizId}/take`);
      return response.data;
    },
  });

  // Start submission mutation
  const startSubmissionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/submissions/start", { quizId });
      return response.data;
    },
    onSuccess: (data: { submission: Submission; questions: Question[] }) => {
      setSubmissionId(data.submission.id);
      setParticipantId(data.submission.participantId);
      handleStartQuiz();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Could not start the quiz session.",
      );
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({
      questionId,
      givenAnswer,
    }: {
      questionId: string;
      givenAnswer: string;
    }) => {
      if (!submissionId || !participantId)
        throw new Error("Submission not started");

      const response = await apiClient.post(
        `/submissions/${submissionId}/answer`,
        {
          questionId,
          givenAnswer,
          participantId,
        },
      );
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to save answer");
    },
  });

  // Finish quiz mutation
  const submissionMutation = useMutation({
    mutationFn: async () => {
      if (!submissionId || !participantId)
        throw new Error("Submission not started");

      const response = await apiClient.post(
        `/submissions/${submissionId}/finish`,
        {
          participantId,
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      navigate({
        to: "/quiz/$quizId/results",
        params: { quizId: data.quizId },
        search: { submissionId: data.id },
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to submit quiz");
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

  // Fullscreen change handler
  useEffect(() => {
    document.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    const handleFullScreenChange = async () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        if (submissionId) {
          toast.warning(
            "You have exited fullscreen mode. Please return to fullscreen.",
          );
          // Log proctoring event
        try {
          const response =   await apiClient
            .post(`/submissions/${submissionId}/proctoring`, {
              eventType: "fullscreen_exit",
              participantId,
              details: { timestamp: new Date().toISOString() },
            }) 
             if (response.data.disqualified) {
          toast.error(`Disqualified: ${response.data.reason}`);
          submissionMutation.mutate(); // Automatically submit the quiz
        }
        } catch (error) {
          
        }
        }
      } else {
        setIsFullScreen(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.addEventListener("contextmenu", function (event) {
        event.preventDefault();
      });
    };
  }, [submissionId, participantId]);

  // Tab visibility handler
  useEffect(() => {
    if (!submissionId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        toast.warning("Tab switch detected");
        try {
          const response = await apiClient
          .post(`/submissions/${submissionId}/proctoring`, {
            eventType: "tab_switch",
            participantId,
            details: { timestamp: new Date().toISOString() },
          })
           if (response.data.disqualified) {
          toast.error(`Disqualified: ${response.data.reason}`);
          submissionMutation.mutate(); // Automatically submit the quiz
        }
        } catch (error) {
          
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submissionId, participantId]);
  useEffect(() => {
    if (!submissionId) return;

    const handleCopy = async (e: ClipboardEvent) => {
      const customText = "Don't try to cheat.";
      e.preventDefault();
      e.clipboardData?.setData("text/plain", customText);
      try {
        const res = await apiClient
        .post(`/submissions/${submissionId}/proctoring`, {
          eventType: "copy_paste",
          participantId,
          details: { timestamp: new Date().toISOString() },
        })
        if(res.data.disqualified){
           toast.error(`Disqualified: ${res.data.reason}`);
          submissionMutation.mutate();
        }
      } catch (error) {
        
      }
    };

    document.addEventListener("copy", (e) => handleCopy(e));
    return () => document.removeEventListener("copy", (e) => handleCopy(e));
  }, [submissionId, participantId]);
  useEffect(() => {
    if (!submissionId) return;

    const handleSS = async (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        toast.error("PrintScreen key detected!");
      }
      await apiClient
        .post(`/submissions/${submissionId}/proctoring`, {
          eventType: "copy_paste",
          participantId,
          details: { timestamp: new Date().toISOString() },
        })
        .catch(() => {});
    };

    document.addEventListener("keyup", (e) => handleSS(e));
    return () => document.removeEventListener("keyup", (e) => handleSS(e));
  }, [submissionId, participantId]);

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
      if (submissionId && participantId) {
        submitAnswerMutation.mutate({ questionId, givenAnswer: answer });
      }
    },
    [submissionId, participantId, submitAnswerMutation],
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
    submissionMutation.mutate();
  }, [submissionMutation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (isLoading || !quizData) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner />
      </div>
    );
  }

  // Show start screen if not in fullscreen
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
          onClick={() => startSubmissionMutation.mutate()}
          disabled={startSubmissionMutation.isPending}
          size="lg"
        >
          {startSubmissionMutation.isPending ? <Spinner /> : "Start Quiz"}
        </Button>
      </div>
    );
  }

  // Use quizData.questions instead of the separate questions state
  const currentQuestion = quizData.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="grid h-full place-items-center">Question not found.</div>
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
                  width: `${(getAnsweredCount() / quizData.questions.length) * 100}%`,
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
                disabled={submissionMutation.isPending}
              >
                {submissionMutation.isPending ? <Spinner /> : "Submit Quiz"}
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
