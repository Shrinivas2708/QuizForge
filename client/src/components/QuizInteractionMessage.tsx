// components/QuizGeneratedMessage.tsx
import { Button } from './ui/button';
import { PlayCircle, RefreshCw, History } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useGenerateQuiz } from '../hooks/useGenerateQuiz';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/axios';
import { Badge } from './ui/badge';
import { Spinner } from './ui/spinner';

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
  sessionId 
}: QuizGeneratedMessageProps) => {
  const navigate = useNavigate();
  const regenerateQuiz = useGenerateQuiz({
  onSuccess() {
    
  },
});

  // 1. Fetch the attempt count for this specific quiz
  const { data: attemptsData, isLoading: isLoadingAttempts } = useQuery<{ count: number }>({
    queryKey: ["quiz", quizId, "attempts-count"],
    queryFn: async () => {
      const response = await apiClient.get(`/quizzes/${quizId}/my-attempts/count`);
      return response.data;
    },
  });
  
  const attemptCount = attemptsData?.count || 0;

  const handleStartQuiz = () => {
    navigate({
      to: '/quiz/$quizId/take',
      params: { quizId },
    });
  };

  const handleRegenerate = () => {
    regenerateQuiz.mutate({
      sourceId,
      sessionId,
      title,
      config: {
        difficulty: 'medium',
        questionCount: 10,
        questionTypes: ['multiple_choice', 'true_false'],
      },
    });
  };

  return (
    <div className="p-6 border rounded-lg space-y-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <div>
        <h3 className="font-semibold text-lg">Quiz Ready!</h3>
        <p className="text-sm text-muted-foreground">
          {title} • {questionCount} questions
        </p>
      </div>

      {/* 2. Display the attempt count below the title */}
      <div>
        {isLoadingAttempts ? (
          <Spinner  />
        ) : (
          <Badge variant="secondary">
            {attemptCount} {attemptCount === 1 ? "Attempt" : "Attempts"} Taken
          </Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleStartQuiz} className="flex-1" size="lg">
          <PlayCircle className="size-4 mr-2" />
          Start Quiz
        </Button>

        {/* 3. Conditionally render the "View Attempts" button */}
        {attemptCount > 0 && (
          <Button asChild variant="secondary" size="lg" className="flex-1">
            <Link to="/quiz/$quizId/attempts" params={{ quizId }}>
              <History className="size-4 mr-2" />
              View Attempts
            </Link>
          </Button>
        )}

        <Button 
          onClick={handleRegenerate} 
          variant="outline" 
          size="lg"
          disabled={regenerateQuiz.isPending}
        >
          <RefreshCw className={`size-4 ${regenerateQuiz.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </div>
   </div>
  );
};