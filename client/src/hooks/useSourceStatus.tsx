import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

interface Source {
  id: string;
  status: 'processing' | 'ready' | 'error';
  // Add other source properties if needed
}

export const useSourceStatus = (sourceId: string | null) => {
  return useQuery<Source>({
    queryKey: ['sourceStatus', sourceId],
    queryFn: async () => {
      if (!sourceId) {
        throw new Error("Source ID is not available.");
      }
      const response = await apiClient.get(`/sources/${sourceId}`);
      return response.data;
    },
    // Poll every 2 seconds until the status is no longer 'processing'
    refetchInterval: (query) => {
      const source = query.state.data;
      return source?.status === 'processing' ? 2000 : false;
    },
    enabled: !!sourceId, // Only run the query if sourceId is available
    refetchOnWindowFocus: false,
  });
};