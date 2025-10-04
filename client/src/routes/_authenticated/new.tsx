import { createFileRoute } from '@tanstack/react-router'
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
} from '@/components/ai-elements/prompt-input';
export const Route = createFileRoute('/_authenticated/new')({
 
  component: RouteComponent,
})

function RouteComponent() {
  return <PromptInput onSubmit={() => {}} className="mt-4 relative">
  <PromptInputBody>
    <PromptInputAttachments>
      {(attachment) => (
        <PromptInputAttachment data={attachment} />
      )}
    </PromptInputAttachments>
    <PromptInputTextarea  />
  </PromptInputBody>
  <PromptInputToolbar>
    <PromptInputTools>
      <PromptInputActionMenu>
        <PromptInputActionMenuTrigger />
        <PromptInputActionMenuContent>
          <PromptInputActionAddAttachments />
        </PromptInputActionMenuContent>
      </PromptInputActionMenu>
    </PromptInputTools>
    <PromptInputSubmit
      disabled={false}
      status={'ready'}
    />
  </PromptInputToolbar>
</PromptInput>
}
