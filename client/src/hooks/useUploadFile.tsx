import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { useNavigate } from "@tanstack/react-router";

interface UploadPayload {
  file: File;
  title: string;
}

export const useUploadFile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadPayload) => {
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("title", payload.title);

      const response = await apiClient.post("/sources/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const source = response.data;

      const chatResponse = await apiClient.post("/chat/sessions", {
        sourceId: source.id,
        title: payload.title,
      });
      
      return { source, chatSession: chatResponse.data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
      navigate({
        to: '/chat/$chatId',
        params: { chatId: data.chatSession.id },
        search: { sourceId: data.source.id, title: data.chatSession.title },
      });
    },
  });
};