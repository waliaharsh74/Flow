"use client"

import { useState } from "react"
import { AuthForm } from "./AuthForm"

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin")
  }

  return <AuthForm mode={mode} onToggleMode={toggleMode} />
}
