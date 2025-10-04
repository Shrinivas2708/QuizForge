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
} from '@/components/ai-elements/prompt-input'
import { useAuth } from '@/context/AuthContext'
export const Route = createFileRoute('/_authenticated/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  return (
    <main className=' flex-1 flex flex-col justify-center mb-28 '>
      <p className='text-3xl text-center font-bold text-pretty text-primary'>Hello {user?.name}</p>
      <p className='text-center text-3xl font-bold'>Ready to forge a new quiz?</p>
      <PromptInput onSubmit={() => {}} className="mt-10 relative md:max-w-3xl mx-auto max-w-sm">
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea />
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
          <PromptInputSubmit disabled={false} status={'ready'} />
        </PromptInputToolbar>
      </PromptInput>
    </main>
  )
}
