import { type ReactNode, useEffect } from "react"
import { useSessionManager } from "../hooks/useSessionManagement"
import { useAuthStore } from "../store/auth"

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { checkAuth } = useAuthStore()

  useSessionManager()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return <>{children}</>
}
