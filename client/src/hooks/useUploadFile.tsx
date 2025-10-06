// hooks/useUploadFile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface UploadPayload {
  file: File;
  title: string;
  replaceSession?: string; // Optional: replace existing session
}

export const useUploadFile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadPayload) => {
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("title", payload.title);
      if (payload.replaceSession) {
        formData.append("replaceSession", payload.replaceSession);
      }

      const response = await apiClient.post("/sources/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
      
      if (variables.replaceSession) {
        toast.success("New document added to conversation");
        queryClient.invalidateQueries({ queryKey: ['chat', data.sessionId] });
      } else {
        navigate({
          to: '/chat/$chatId',
          params: { chatId: data.sessionId },
        });
      }
    },
    onError: () => {
      toast.error("Failed to upload document");
    },
  });
};