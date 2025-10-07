import apiClient from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
type AttemptData = {
  id: string;
  finalScore: number | null;
  completedAt: Date | null;
  attemptNumber: number | null;
  disqualified: boolean | null;
  disqualificationReason: string | null;
}[];
export const getAttempts =  (quizId:string) =>{
   return useQuery({
    queryKey: ["quiz", quizId, "my-attempts"],
    queryFn: async () => {
      const response = await apiClient.get(`/quizzes/${quizId}/my-attempts`);
      return response.data as AttemptData;
    },
  });
}