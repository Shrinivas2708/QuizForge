// components/QuizConfigMessage.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { useGenerateQuiz } from '../hooks/useGenerateQuiz';
import { Loader2 } from 'lucide-react';

interface QuizConfigMessageProps {
  sourceId: string;
  title: string;
  sessionId: string;
}

export const QuizConfigMessage = ({ sourceId, title, sessionId }: QuizConfigMessageProps) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const generateQuiz = useGenerateQuiz(
    {
      onSuccess() {
        
      },
    }
  );

  const handleGenerate = () => {
    generateQuiz.mutate({
      sourceId,
      title: `Quiz - ${title}`,
      sessionId, // Pass sessionId
      config: {
        difficulty,
        questionCount,
        questionTypes: ['multiple_choice', 'true_false'],
      },
    });
  };

  if (generateQuiz.isPending) {
    return (
      <div className="p-6 border rounded-lg space-y-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <h3 className="font-semibold">Generating your quiz...</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing content and crafting {questionCount} {difficulty} questions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg space-y-4 bg-card">
      <div>
        <h3 className="font-semibold text-lg">Generate Quiz</h3>
        <p className="text-sm text-muted-foreground">Configure your quiz settings</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <Button
                key={level}
                variant={difficulty === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDifficulty(level)}
                className="flex-1"
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Number of Questions: {questionCount}
          </label>
          <input
            type="range"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            min={5}
            max={30}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>5</span>
            <span>30</span>
          </div>
        </div>
      </div>

      <Button onClick={handleGenerate} className="w-full" size="lg">
        Generate Quiz
      </Button>
    </div>
  );
};