import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { useNavigate } from "@tanstack/react-router";

interface CreateSessionPayload {
  content: string;
  title?: string;
}

export const useCreateTextSession = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSessionPayload) => {
      const response = await apiClient.post("/chat/sessions/create", payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
      navigate({
        to: '/chat/$chatId',
        params: { chatId: data.id },
      });
    },
  });
};