"use client"

import { useEffect, useState } from "react"
import { AuthForm } from "./AuthForm"
import { useSearchParams } from "react-router-dom"
import { AuthMode } from "@/types"

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin")
  const [searchParams] = useSearchParams()

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin")
  }

  const oauthMessage =
    searchParams.get("message") ??
    searchParams.get("oauth_message") ??
    searchParams.get("error_description")

  useEffect(() => {
    const nextMode = searchParams.get("intent") ?? searchParams.get("mode")

    if (nextMode === "signin" || nextMode === "signup") {
      setMode(nextMode)
    }
  }, [searchParams])

  return <AuthForm mode={mode} onToggleMode={toggleMode} oauthMessage={oauthMessage} />
}
