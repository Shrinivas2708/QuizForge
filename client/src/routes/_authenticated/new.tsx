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
  type PromptInputMessage, // Import the message type
} from '@/components/ai-elements/prompt-input'
import { useAuth } from '@/context/AuthContext'
import { useUploadFile } from '@/hooks/useUploadFile'
import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  const [isChatStarted, setIsChatStarted] = useState(false)
  const uploadFile = useUploadFile()

  // This function is passed to PromptInput's onSubmit prop
  const handleSubmit = async (message: PromptInputMessage) => {
    const filePart = message.files?.[0]
    if (!filePart || !filePart.url) {
      toast.error('Please attach a file to start a chat.')
      return
    }

    try {
      // The PromptInput component provides the file as a data URL.
      // We convert it back to a File object to send to the server.
      const response = await fetch(filePart.url)
      const blob = await response.blob()
      const file = new File([blob], filePart.filename || 'untitled', {
        type: filePart.mediaType,
      })

      setIsChatStarted(true)
      uploadFile.mutate({ file, title: file.name })
    } catch (error) {
      toast.error('There was an error processing the file.')
      console.error(error)
    }
  }

  return (
    <main
      className={`flex-1 flex flex-col ${
        isChatStarted ? 'justify-end' : 'justify-center'
      } mb-28 transition-all duration-300 ease-in-out`}
    >
      {!isChatStarted && (
        <>
          <p className="text-3xl text-center font-bold text-pretty text-primary">
            Hello {user?.name}
          </p>
          <p className="text-center text-3xl font-bold">
            Ready to forge a new quiz?
          </p>
        </>
      )}

      {uploadFile.isPending && (
        <div className="flex justify-center items-center gap-2 my-4">
          <Spinner />
          <p>Processing your document...</p>
        </div>
      )}

      <PromptInput
        onSubmit={handleSubmit}
        className="mt-10 relative md:max-w-3xl mx-auto max-w-sm"
      >
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea placeholder="Attach a document and press Enter or the send button to start..." />
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
            disabled={uploadFile.isPending}
            status={uploadFile.isPending ? 'submitted' : 'ready'}
          />
        </PromptInputToolbar>
      </PromptInput>
    </main>
  )
}