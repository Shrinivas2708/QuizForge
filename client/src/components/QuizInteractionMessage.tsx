import { useState } from "react";
import { useSourceStatus } from "@/hooks/useSourceStatus";
import { useGenerateQuiz } from "@/hooks/useGenerateQuiz";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface QuizInteractionMessageProps {
  message: {
    id: string;
    content: { sourceId: string; title: string; };
  };
  onGenerate: (text: string) => void;
}

export function QuizInteractionMessage({ message, onGenerate }: QuizInteractionMessageProps) {
  const { sourceId, title } = message.content;
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizGenerated, setQuizGenerated] = useState(false);
  
  const { data: source, error } = useSourceStatus(sourceId);
  const generateQuiz = useGenerateQuiz({
    onSuccess: () => {
      setQuizGenerated(true);
    }
  });

  const handleGenerateClick = () => {
    // 1. Send the user's action as a new message in the chat
    onGenerate(`Generate a quiz with ${difficulty} difficulty.`);
    // 2. Trigger the actual quiz generation mutation
    generateQuiz.mutate({
      sourceId,
      title,
      config: { difficulty, questionCount: 10, questionTypes: ["multiple_choice"] },
    });
  };

  const renderContent = () => {
    if (quizGenerated) {
       return (
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Quiz Ready!</h3>
          <p className="text-sm text-muted-foreground">Your quiz for "{title}" is ready.</p>
          <Button onClick={() => toast.info("Quiz starting is on the way!")}>Start Quiz</Button>
        </div>
      );
    }

    if (generateQuiz.isPending) {
       return (
        <div className="flex items-center gap-3 p-4">
          <Spinner />
          <p>Forging your quiz...</p>
        </div>
      );
    }
    
    if (source?.status === 'ready') {
      return (
        <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Generate a Quiz</h3>
              <p className="text-sm text-muted-foreground">Select a difficulty to begin.</p>
            </div>
            <div className="flex items-center gap-2">
                <Select onValueChange={(value: any) => setDifficulty(value)} defaultValue={difficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleGenerateClick}>Generate</Button>
            </div>
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">Error processing document.</p>;
    }

    // Default: Document is processing
    return (
      <div className="flex items-center gap-3 p-4">
        <Spinner />
        <p>Analyzing your document...</p>
      </div>
    );
  };

  return renderContent();
}