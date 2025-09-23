import { useEffect, useCallback } from "react"
import { useAuthStore } from "../store/auth"

export function useSessionManager() {
  const { isAuthenticated, checkAuth, signOut } = useAuthStore()

  const checkSession = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await checkAuth()
      } catch (error) {
        console.warn("Session check failed:", error)
        await signOut()
      }
    }
  }, [isAuthenticated, checkAuth, signOut])

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(checkSession, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, checkSession])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        checkSession()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isAuthenticated, checkSession])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth-storage" && e.newValue) {
        const newAuth = JSON.parse(e.newValue)
        if (!newAuth.state.isAuthenticated && isAuthenticated) {
          signOut()
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [isAuthenticated, signOut])

  return {
    checkSession,
  }
}
