import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
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
}

// Define types for the mutation function
type GenerateQuizData = any; // You can replace 'any' with the actual type of the returned quiz
type GenerateQuizError = { response?: { data?: { error?: string } } };

// Define the type for the options that can be passed to the hook
type GenerateQuizOptions = Omit<
  UseMutationOptions<GenerateQuizData, GenerateQuizError, GenerateQuizPayload>,
  'mutationFn'
>;


export const useGenerateQuiz = (options?: GenerateQuizOptions) => {
  return useMutation({
    mutationFn: async (payload: GenerateQuizPayload) => {
      const response = await apiClient.post("/quizzes", payload);
      return response.data;
    },
    // Default success toast
    onSuccess: () => {
      toast.success("Quiz generated successfully!");
    },
    // Default error toast
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to generate quiz.");
    },
    // Spread any custom options from the user, which can override the defaults
    ...options,
  });
};