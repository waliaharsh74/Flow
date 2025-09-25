"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "../store/auth"
import { AppState } from "@/types"
import { Button } from "../components/ui/button"

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const navigate=useNavigate()

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
      const [appState, setAppState] = useState<AppState>("loading")
  
    useEffect(() => {
      const initAuth = async () => {
        await checkAuth()
        setAppState(isAuthenticated ? "authenticated" : "auth")
      }
  
      initAuth()
    }, [checkAuth, isAuthenticated])
  
    useEffect(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          if (appState === "auth") {
            setAppState("authenticated")
          }
        } else {
          setAppState("auth")
        }
      }
    }, [isAuthenticated, isLoading, appState])

  if (appState === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (appState === "auth") {
    navigate('/')
    
  }

  return <>{children}</>
}
