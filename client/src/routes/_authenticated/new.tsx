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
import { useCreateTextSource } from '@/hooks/useCreateTextSource'

export const Route = createFileRoute('/_authenticated/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  const [isChatStarted, setIsChatStarted] = useState(false)
  const uploadFile = useUploadFile()
 const createTextSource = useCreateTextSource() // Use the new hook

  const isProcessing = uploadFile.isPending || createTextSource.isPending

  const handleSubmit = async (message: PromptInputMessage) => {
    const filePart = message.files?.[0]
    const textPart = message.text?.trim()

    if (filePart && filePart.url) {
      try {
        const response = await fetch(filePart.url)
        const blob = await response.blob()
        const file = new File([blob], filePart.filename || 'untitled', {
          type: filePart.mediaType,
        })
        console.log(file.type);
        if(file.type == "application/pdf" ) {

        setIsChatStarted(true)
        uploadFile.mutate({ file, title: file.name })
        }else{
          toast.error("currently we only support pdf files.")
        }
        
      } catch (error) {
        toast.error('There was an error processing the file.')
        console.error(error)
      }
    } else if (textPart) {
      toast.error('We currently only support documents attach a document to get started!')
    } else {
      toast.error('Please attach a file!')
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

      {isProcessing && (
        <div className="flex justify-center items-center gap-2 my-4">
          <Spinner />
          <p>Processing your content...</p>
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
          <PromptInputTextarea className='text-2xl' placeholder="Attach a document to start..." />
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
            disabled={isProcessing}
            status={isProcessing ? 'submitted' : 'ready'}
          />
        </PromptInputToolbar>
      </PromptInput>
    </main>
  )
}