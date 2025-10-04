import { useInfiniteQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

interface ChatHistoryItem {
  id: string;
  title: string;
}

const fetchChatHistory = async ({ pageParam = 1 }) => {
  const res = await apiClient.get<ChatHistoryItem[]>(`/chat/sessions/history?page=${pageParam}&limit=15`);
  return res.data;
};

export const useChatHistory = () => {
  return useInfiniteQuery({
    queryKey: ['chatHistory'],
    queryFn: fetchChatHistory,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has items, there might be a next page
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    
  });
};