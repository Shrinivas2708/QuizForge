import { useState } from "react";
import { useSourceStatus } from "@/hooks/useSourceStatus";
import { useGenerateQuiz } from "@/hooks/useGenerateQuiz";
import { Spinner } from "./ui/spinner";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface QuizGenerationProps {
  sourceId: string;
  sourceTitle: string;
}

export function QuizGeneration({ sourceId, sourceTitle }: QuizGenerationProps) {
  const navigate = useNavigate({ from: '/chat/$chatId' });
  const { data: source, error } = useSourceStatus(sourceId);
  const generateQuiz = useGenerateQuiz(
    {
      onSuccess() {
        
      },
    }
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleGenerateQuiz = () => {
    generateQuiz.mutate({
      sourceId,
      title: sourceTitle,
      config: {
        difficulty,
        questionCount: 10,
        questionTypes: ["multiple_choice", "true_false"],
      },
      sessionId: ""
    });
  };

  const handleContinueToChat = () => {
    // Navigate to the same page but remove the search params to switch to chat view
    navigate({ search: {}, replace: true });
  };

  if (error) {
    return (
      <div className="text-center text-destructive">
        <p>Error processing document: {error.message}</p>
        <Button onClick={() => navigate({ to: '/new' })} variant="link">
          Upload a new file
        </Button>
      </div>
    );
  }

  if (generateQuiz.isSuccess) {
    return (
      <div className="text-center">
        <p className="text-xl font-semibold mb-4">Your quiz is ready!</p>
        <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => toast.info("Quiz starting functionality is coming soon!")}>
              Start Quiz
            </Button>
            <Button size="lg" variant="outline" onClick={handleContinueToChat}>
              Continue to Chat
            </Button>
        </div>
      </div>
    );
  }

  if (generateQuiz.isPending) {
     return (
      <div className="flex items-center justify-center gap-2">
        <Spinner />
        <p>Forging your quiz, this may take a moment...</p>
      </div>
    );
  }

  if (source?.status === 'ready') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Document Ready!</CardTitle>
          <CardDescription>
            Select a difficulty to generate a quiz, or switch to chat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value: any) => setDifficulty(value)} defaultValue={difficulty}>
            <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleGenerateQuiz} disabled={generateQuiz.isPending}>Generate Quiz</Button>
          <Button variant="ghost" onClick={handleContinueToChat}>Ask Questions Instead</Button>
        </CardFooter>
      </Card>
    );
  }

  // Default state while document is processing
  return (
    <div className="flex items-center justify-center gap-2">
      <Spinner />
      <p>Analyzing your document, please wait...</p>
    </div>
  );
}