import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useSession } from '@/lib/auth-client'
import type { BetterFetchError } from 'better-auth/react'

// Define the User interface based on your server's response
interface User {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt:Date
  updatedAt:Date
  emailVerified:boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: BetterFetchError | null
  currentSessionId:string | null
  refetch: () => void
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error, refetch } = useSession()
const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(
  () => localStorage.getItem("currentSessionId") || null
);

// Typed wrapper to match Dispatch<SetStateAction<string | null>>
const setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>> = (value) => {
  // Handle functional updates
  const id = typeof value === "function" ? value(currentSessionId) : value;

  setCurrentSessionIdState(id);

  if (id) localStorage.setItem("currentSessionId", id);
  else localStorage.removeItem("currentSessionId");
};
  // Derive what you want
  const user = session?.user ?? null;
  // const user = {
  //   name: 'Test User',
  //   email: 'testuser@example.com',
  //   emailVerified: false,
  //   image: null,
  //   createdAt: '2025-10-02T12:53:29.826Z',
  //   updatedAt: '2025-10-02T12:53:29.826Z',
  //   id: 'hRYKpAolvrs2pn7jf0AIjslU1PM82Kzg',
  // }
  const isAuthenticated = !!user
  const isLoading = isPending
  // const isAuthenticated = true
  // const isLoading = false
  // const error = null
  // const refetch = ()=> console.log("refetch");
  
  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      currentSessionId,
      setCurrentSessionId,
      refetch,
    }),
    [user, isAuthenticated, isLoading, error, refetch,currentSessionId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
