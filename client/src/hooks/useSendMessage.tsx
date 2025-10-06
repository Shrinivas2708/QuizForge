import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';

interface SendMessagePayload {
  chatId: string;
  content: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const { chatId, content } = payload;
      const response = await apiClient.post(`/chat/sessions/${chatId}/message`, { content });
      
      return response.data as ChatMessage;
    },
    
    onMutate: async (newMessage: SendMessagePayload) => {
      await queryClient.cancelQueries({ queryKey: ['chat', newMessage.chatId] });
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat', newMessage.chatId]);

      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        sessionId: newMessage.chatId,
        role: 'user',
        content: newMessage.content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(['chat', newMessage.chatId], (old) =>
        old ? [...old, optimisticMessage] : [optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (_err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat', newMessage.chatId], context.previousMessages);
      }
      toast.error("Failed to send message.");
    },

    onSuccess: (data: ChatMessage, variables) => {
      queryClient.setQueryData<ChatMessage[]>(['chat', variables.chatId], (old) => {
          if (!old) return [data];
          // Replace the optimistic user message with the real one from the server and add the AI's response
          const filtered = old.filter(msg => !msg.id.startsWith('optimistic-'));
          return [...filtered, data];
      });
    },

    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['chat', data.sessionId] });
      }
    },
  });
};