import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Spinner } from '@/components/ui/spinner';
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from '@/components/ai-elements/prompt-input';
import { useSendMessage } from '@/hooks/useSendMessage';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageAvatar } from '@/components/ai-elements/message';
import { MessageSquare, FileText, BotIcon } from 'lucide-react';
import { Response } from '@/components/ai-elements/response';
import { QuizInteractionMessage } from '@/components/QuizInteractionMessage';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'document_upload' | 'quiz_interaction';
  content: any;
}

export const Route = createFileRoute('/_authenticated/chat/$chatId')({
  component: ChatComponent,
});

function ChatComponent() {
  const { chatId } = Route.useParams();
  const { user } = useAuth(); // Get user for avatar
  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const response = await apiClient.get(`/chat/sessions/${chatId}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const sendMessageMutation = useSendMessage();

  const handleSendMessage = (message: { text?: string }) => {
    if (!message.text?.trim()) return;
    sendMessageMutation.mutate({ chatId, content: message.text });
  };

  const renderMessage = (message: ChatMessage) => {
    switch (message.type) {
      case 'text':
        return (
          <Message from={message.role} key={message.id}>
             {message.role === 'assistant' && <MessageAvatar name="AI" icon={<BotIcon />} />}
            <MessageContent>
              <Response>{message.content.text}</Response>
            </MessageContent>
            {message.role === 'user' && <MessageAvatar src={user?.image!} name={user?.name || 'U'} />}
          </Message>
        );
      case 'document_upload':
        return (
           <Message from="user" key={message.id}>
             <MessageContent variant="flat" className="bg-muted text-muted-foreground border-dashed">
                <div className="flex items-center gap-2">
                    <FileText className="size-4" />
                    <span>You uploaded {message.content.title}</span>
                </div>
             </MessageContent>
             <MessageAvatar src={user?.image!} name={user?.name || 'U'} />
           </Message>
        );
      case 'quiz_interaction':
        return (
            <Message from="assistant" key={message.id}>
                <MessageAvatar name="AI" icon={<BotIcon />} />
                <MessageContent>
                    <QuizInteractionMessage message={message} onGenerate={(text) => handleSendMessage({ text })} />
                </MessageContent>
            </Message>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <Conversation>
        <ConversationContent>
          {isLoading ? (
            <div className="flex h-full justify-center items-center"><Spinner /></div>
          ) : messages && messages.length > 0 ? (
            messages.map(renderMessage)
          ) : (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="Start a conversation"
              description="Upload a new document to begin."
            />
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-4 border-t">
        <PromptInput
          onSubmit={handleSendMessage}
          className="max-w-3xl mx-auto"
          key={messages?.length}
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask a question about your document..."
              disabled={sendMessageMutation.isPending}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputSubmit
              status={sendMessageMutation.isPending ? 'submitted' : 'ready'}
              disabled={sendMessageMutation.isPending}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}