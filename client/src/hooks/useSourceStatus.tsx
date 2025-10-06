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
      const response = await apiClient.get(`/sources/${sourceId}/status`);
      return response.data;
    },
    // Poll every 2 seconds until the status is no longer 'processing'
    refetchInterval: (query) => {
      const data = query.state.data as Source | undefined;
      if (data?.status === 'ready' || data?.status === 'error') {
        return false; // Stop polling
      }
      return 2000; // Continue polling every 2 seconds
    },
    enabled: !!sourceId, // Only run the query if sourceId is available
  });
};