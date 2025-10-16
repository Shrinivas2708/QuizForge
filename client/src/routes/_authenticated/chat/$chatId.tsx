import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../lib/axios";
import { Spinner } from "../../../components/ui/spinner";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "../../../components/ai-elements/prompt-input";
import { useSendMessage } from "../../../hooks/useSendMessage";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "../../../components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "../../../components/ai-elements/message";
import { MessageSquare, FileText, BotIcon } from "lucide-react";
import { Response } from "../../../components/ai-elements/response";
import { useAuth } from "../../../context/AuthContext";
import { QuizConfigMessage } from "@/components/QuizConfigMessage";
import { useSourceStatus } from "@/hooks/useSourceStatus";
import { ProcessingMessage } from "@/components/ProcessingMessage";
import { QuizGeneratedMessage } from "@/components/QuizInteractionMessage";
import { useEffect, useRef, useState } from "react";
import { useUploadFile } from "@/hooks/useUploadFile";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  type:
    | "text"
    | "document_upload"
    | "quiz_interaction"
    | "processing_complete"
    | "quiz_generated";
  content: any;
  createdAt: string;
}

export const Route = createFileRoute("/_authenticated/chat/$chatId")({
  component: ChatComponent,
});

function ChatComponent() {
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const { chatId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uploadFile = useUploadFile();
  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await apiClient.get(`/chat/sessions/${chatId}`);
      return response.data.reverse();
    },
    refetchOnWindowFocus: false,
  });
  const chatRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  const latestSource = messages?.find((m) => m.type === "document_upload")
    ?.content as { sourceId: string; title: string } | undefined;
  const { data: sourceStatus } = useSourceStatus(
    latestSource?.sourceId || null,
  );

  useEffect(() => {
    if (sourceStatus?.status === "ready") {
      const hasCompleteMessage = messages?.some(
        (m) => m.type === "processing_complete",
      );
      if (!hasCompleteMessage) {
        queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      }
    }
  }, [sourceStatus?.status, messages, chatId, queryClient]);

  const sendMessageMutation = useSendMessage();

 
const showProcessing = latestSource && sourceStatus?.status === "processing";
  const renderMessage = (message: ChatMessage) => {
    switch (message.type) {
      case "text": {
        const content = message.content as { text: string };
        return (
          <Message from={message.role} key={message.id}>
            {message.role === "assistant" && (
              showProcessing ? <MessageAvatar  name="AI" icon={<BotIcon />} className=" animate-pulse"/>:<MessageAvatar name="AI" icon={<BotIcon />} />
            )}
            <MessageContent>
              <Response>{content.text}</Response>
            </MessageContent>
            {message.role === "user" && (
              <MessageAvatar src={user?.image!} name={user?.name || "U"} />
            )}
          </Message>
        );
      }

      case "document_upload": {
        const content = message.content as { title: string; sourceId: string };
        return (
          <Message from="user" key={message.id}>
            <MessageContent
              variant="flat"
              className="bg-muted text-muted-foreground border-dashed"
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4" />
                <span>You uploaded {content.title}</span>
              </div>
            </MessageContent>
            <MessageAvatar src={user?.image!} name={user?.name || "U"} />
          </Message>
        );
      }

      case "processing_complete": {
        const content = message.content as { sourceId: string };
        return (
          <Message from="assistant" key={message.id}>
            <MessageAvatar name="AI" icon={<BotIcon />} />
            <MessageContent>
              <QuizConfigMessage
                sourceId={content.sourceId}
                title={latestSource?.title || "Document"}
                sessionId={chatId}
              />
            </MessageContent>
          </Message>
        );
      }

      case "quiz_generated": {
        const content = message.content as {
          quizId: string;
          title: string;
          questionCount: number;
        };
        return (
          <Message from="assistant" key={message.id}>
            <MessageAvatar name="AI" icon={<BotIcon />} />
            <MessageContent>
              <QuizGeneratedMessage
                quizId={content.quizId}
                title={content.title}
                questionCount={content.questionCount}
                sourceId={latestSource?.sourceId || ""}
                sessionId={chatId}
              />
            </MessageContent>
          </Message>
        );
      }

      default:
        return null;
    }
  };

  

  return (
    <div className="scrollbar flex h-full flex-col" ref={chatRef}>
      {/* Scrollable conversation area - takes remaining space */}
      <div className="min-h-0 flex-1">
        <Conversation className="h-full">
          <ConversationContent>
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {messages.map(renderMessage)}
                {showProcessing && (
                  <Message from="assistant">
                    <MessageAvatar name="AI" icon={<BotIcon />} />
                    <MessageContent>
                      <ProcessingMessage />
                    </MessageContent>
                  </Message>
                )}
              </>
            ) : (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a new conversation"
                description="Upload a document to begin generating quizzes and asking questions."
              />
            )}
          </ConversationContent>
        </Conversation>
      </div>

      {/* Fixed prompt input at bottom */}

      <div className="pb-5">
        <PromptInput
          accept=".pdf"
          maxFiles={1}
          maxFileSize={10 * 1024 * 1024}
          onSubmit={(message) => {
            if (message.files && message.files.length > 0) {
              const file = message.files[0];
              fetch(file.url!)
                .then((res) => res.blob())
                .then((blob) => {
                  const actualFile = new File([blob], file.filename!, {
                    type: "application/pdf",
                  });
                  uploadFile.mutate({
                    file: actualFile,
                    title: file.filename!,
                    replaceSession: chatId,
                  });
                });
            } else if (message.text) {
              // Ensure the controlled input matches the submitted text
              setCurrentMessage("");
              // Use per-mutation callbacks so we only clear the input on success
              sendMessageMutation.mutate(
                { chatId, content: message.text },
                {
                  onSuccess: () => setCurrentMessage(""),
                  onError: () => {
                    setCurrentMessage(message.text!);
                  },
                },
              );
            }
          }}
          onError={(err) => {
            if ("message" in err) {
              toast.error(err.message);
            } else {
              toast.error("An unexpected error occurred.");
            }
          }}
          className="mx-auto max-w-3xl"
        >
          <PromptInputBody>
            <PromptInputAttachments>
                        {(attachment) => <PromptInputAttachment data={attachment} />}
                      </PromptInputAttachments>
            <PromptInputTextarea
              placeholder="Ask a question or attach a PDF document..."
              disabled={sendMessageMutation.isPending || showProcessing}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.currentTarget.value)}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments label="Upload PDF Document" />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit
                status={sendMessageMutation.isPending ? "submitted" : "ready"}
                disabled={sendMessageMutation.isPending || showProcessing}
              />
            </PromptInputToolbar>
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
}
