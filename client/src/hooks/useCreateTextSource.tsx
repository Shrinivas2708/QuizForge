import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import apiClient from '@/lib/axios'
import { toast } from 'sonner'

interface CreateTextSourcePayload {
  content: string
  title?: string
}

export function useCreateTextSource() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (payload: CreateTextSourcePayload) => {
      const response = await apiClient.post('/sources/text', payload)
      return response.data
    },
    onSuccess: (data) => {
      // On success, navigate to the newly created chat session
      toast.success('Your new chat is ready!')
      navigate({
        to: '/chat/$chatId',
        params: { chatId: data.sessionId },
      })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || 'Failed to create chat from text.',
      )
    },
  })
}