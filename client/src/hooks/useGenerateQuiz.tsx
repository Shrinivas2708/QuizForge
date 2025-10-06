// hooks/useGenerateQuiz.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

interface QuizConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionTypes: string[];
}

interface GenerateQuizPayload {
  sourceId: string;
  title: string;
  config: QuizConfig;
  sessionId: string; // ADD THIS
}

export const useGenerateQuiz = (_p0: { onSuccess: () => void; }) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: GenerateQuizPayload) => {
      const response = await apiClient.post("/quizzes", payload);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast.success("Quiz generated successfully!");
      // Invalidate chat to show the new quiz_generated message
      queryClient.invalidateQueries({ queryKey: ['chat', variables.sessionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to generate quiz.");
    },
  });
};