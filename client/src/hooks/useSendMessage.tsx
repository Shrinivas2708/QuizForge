import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';

// Make sure this interface matches the one in your component
interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  type: string; // Use a broader type or import the specific union type
  content: any;
  createdAt: string;
}

interface SendMessagePayload {
  chatId: string;
  content: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const { chatId, content } = payload;
      // The backend should return the AI's response message
      const response = await apiClient.post(`/chat/sessions/${chatId}/message`, { content });
      return response.data as ChatMessage;
    },

    onMutate: async (newMessage: SendMessagePayload) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat', newMessage.chatId] });

      // 2. Snapshot the previous value
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat', newMessage.chatId]);

      // 3. Create the optimistic message with the CORRECT SHAPE ✨
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        sessionId: newMessage.chatId,
        role: 'user',
        type: 'text', // Assuming it's always a text message
        content: { text: newMessage.content }, // ✅ Corrected: content is now an object
        createdAt: new Date().toISOString(),
      };
      const optimistincAssistantMessage : ChatMessage ={
        id: `optimistic-assistant-${Date.now()}`,
        sessionId: newMessage.chatId,
        role: "assistant",
        type:"text",
        content: {text:"Thinking…"},
        createdAt: new Date().toISOString(),
      }
      // 4. Optimistically update to the new value
      queryClient.setQueryData<ChatMessage[]>(['chat', newMessage.chatId], (old) =>
        old ? [...old, optimisticMessage,optimistincAssistantMessage] : [optimisticMessage,optimistincAssistantMessage]
      );

      // 5. Return a context object with the snapshotted value
      return { previousMessages };
    },

    // If the mutation fails, use the context we returned from onMutate to roll back
    onError: (_err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat', newMessage.chatId], context.previousMessages);
      }
      toast.error('Failed to send message. Please try again.');
    },

    // Always refetch after error or success to ensure the final state is correct
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
    },
  });  
};