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
      const response = await apiClient.post('/submissions/start', { quizId });
      return response.data;
    },
    onSuccess: (data: { submission: Submission; questions: Question[] }) => {
      setSubmissionId(data.submission.id);
      setParticipantId(data.submission.participantId);
      handleStartQuiz();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Could not start the quiz session.");
    }
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, givenAnswer }: { questionId: string; givenAnswer: string }) => {
      if (!submissionId || !participantId) throw new Error("Submission not started");
      
      const response = await apiClient.post(`/submissions/${submissionId}/answer`, {
        questionId,
        givenAnswer,
        participantId,
      });
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to save answer");
    }
  });

  // Finish quiz mutation
  const submissionMutation = useMutation({
    mutationFn: async () => {
      if (!submissionId || !participantId) throw new Error("Submission not started");
      
      const response = await apiClient.post(`/submissions/${submissionId}/finish`, {
        participantId
      });
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
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [submissionId]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        if (submissionId) {
          toast.warning("You have exited fullscreen mode. Please return to fullscreen.");
          // Log proctoring event
          apiClient.post(`/submissions/${submissionId}/proctoring`, {
            eventType: "fullscreen_exit",
            participantId,
            details: { timestamp: new Date().toISOString() }
          }).catch(() => {});
        }
      } else {
        setIsFullScreen(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, [submissionId, participantId]);

  // Tab visibility handler
  useEffect(() => {
    if (!submissionId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning("Tab switch detected");
        apiClient.post(`/submissions/${submissionId}/proctoring`, {
          eventType: "tab_switch",
          participantId,
          details: { timestamp: new Date().toISOString() }
        }).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submissionId, participantId]);

  const handleStartQuiz = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      toast.error("Failed to enter fullscreen mode.");
    }
  };

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (submissionId && participantId) {
      submitAnswerMutation.mutate({ questionId, givenAnswer: answer });
    }
  }, [submissionId, participantId, submitAnswerMutation]);

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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (isLoading || !quizData) {
    return (
      <div className="grid place-items-center h-full">
        <Spinner />
      </div>
    );
  }

  // Show start screen if not in fullscreen
  if (!isFullScreen) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{quizData.title}</h1>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quiz must be taken in fullscreen mode to ensure a focused environment. 
            Exiting fullscreen during the quiz may result in disqualification.
          </AlertDescription>
        </Alert>
        <div className="space-y-2 mb-6 text-left w-full">
          <p className="flex items-center gap-2">
            <span className="font-medium">Questions:</span> {quizData.questions.length}
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
    return <div className="grid place-items-center h-full">Question not found.</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle>{quizData.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(elapsedTime)}
              </span>
              <span>
                Question {currentQuestionIndex + 1} of {quizData.questions.length}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${(getAnsweredCount() / quizData.questions.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getAnsweredCount()} of {quizData.questions.length} answered
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-lg font-medium">{currentQuestion.questionText}</p>
          <div className="flex flex-col gap-3">
            {currentQuestion.questionType === 'true_false' ? (
              <>
                <Button 
                  variant={answers[currentQuestion.id] === 'True' ? 'default' : 'outline'} 
                  onClick={() => handleAnswer(currentQuestion.id, 'True')}
                  className="h-auto py-3"
                >
                  True
                </Button>
                <Button 
                  variant={answers[currentQuestion.id] === 'False' ? 'default' : 'outline'} 
                  onClick={() => handleAnswer(currentQuestion.id, 'False')}
                  className="h-auto py-3"
                >
                  False
                </Button>
              </>
            ) : (
              currentQuestion.data?.options?.map((option: string) => (
                <Button
                  key={option}
                  variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                  className="h-auto min-h-12 py-3 whitespace-normal text-left justify-start"
                >
                  {option}
                </Button>
              ))
            )}
          </div>
          <div className="flex justify-between mt-8 gap-2">
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