// components/QuizGeneratedMessage.tsx
import { Button } from './ui/button';
import { PlayCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGenerateQuiz } from '../hooks/useGenerateQuiz';

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
  const regenerateQuiz = useGenerateQuiz(
    {
      onSuccess() {
        
      },
    }
  );

  const handleStartQuiz = () => {
    navigate({
      to: '/quiz/$quizId/take',
      params: { quizId },
    });
  };

  const handleRegenerate = () => {
    // You'll need to get the config from somewhere, or use default
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

      <div className="flex gap-2">
        <Button onClick={handleStartQuiz} className="flex-1" size="lg">
          <PlayCircle className="size-4 mr-2" />
          Start Quiz
        </Button>
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