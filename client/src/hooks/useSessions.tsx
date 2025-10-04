import { useQuery } from "@tanstack/react-query"
import { authClient } from "../lib/auth-client"

export const useSessions =  ()=>{
    return  useQuery({
        queryKey:['sessions'],
        queryFn: async ()=>{
            const res =  await authClient.listSessions()
            return res.data?.reverse()
        },
        staleTime:Infinity,
        gcTime: 1000 * 60 * 30
    })
    
}
