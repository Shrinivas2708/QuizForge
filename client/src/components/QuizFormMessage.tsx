import { useState } from "react";
import { useSourceStatus } from "@/hooks/useSourceStatus";
import { useGenerateQuiz } from "@/hooks/useGenerateQuiz";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface QuizFormMessageProps {
  message: {
    id: string;
    content: { sourceId: string; title: string; };
  };
}

// This component will now render different states within a single styled bubble.
export function QuizFormMessage({ message }: QuizFormMessageProps) {
  const { sourceId, title } = message.content;
  const queryClient = useQueryClient();
  const { data: source, error } = useSourceStatus(sourceId);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const generateQuiz = useGenerateQuiz({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    }
  });

  const renderContent = () => {
    if (generateQuiz.isSuccess) {
      return (
        <div className="text-center">
          <h3 className="font-semibold mb-2">Quiz Ready!</h3>
          <p className="text-sm text-muted-foreground mb-4">Your quiz for "{title}" is ready to start.</p>
          <Button onClick={() => toast.info("Quiz starting is on the way!")}>Start Quiz</Button>
        </div>
      );
    }

    if (generateQuiz.isPending) {
      return (
        <div className="flex items-center gap-3">
          <Spinner />
          <p>Forging your quiz, this may take a moment...</p>
        </div>
      );
    }
    
    if (source?.status === 'ready') {
      return (
        <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Generate a Quiz</h3>
              <p className="text-sm text-muted-foreground">Select a difficulty for the quiz on "{title}".</p>
            </div>
            <div className="flex items-center gap-4">
                <Select onValueChange={(value: any) => setDifficulty(value)} defaultValue={difficulty}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
                <Button 
                    onClick={() => generateQuiz.mutate({ sourceId, title, config: { difficulty, questionCount: 10, questionTypes: ["multiple_choice"] } })} 
                    disabled={generateQuiz.isPending}
                >
                    Generate
                </Button>
            </div>
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">Error processing document.</p>;
    }

    // Default: Document is processing
    return (
      <div className="flex items-center gap-3">
        <Spinner />
        <p>Analyzing your document...</p>
      </div>
    );
  };

  return (
    <div className="bg-muted p-4 rounded-lg max-w-md w-full my-4">
      {renderContent()}
    </div>
  );
}