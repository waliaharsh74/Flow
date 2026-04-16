"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Github, Loader2 } from "lucide-react"
import { Button } from "./../components/ui/button"
import { Input } from "./../components/ui/input"
import { Label } from "./../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./../components/ui/card"
import { Alert, AlertDescription } from "./../components/ui/alert"
import { useAuthStore } from "../store/auth"
import { Separator } from "./ui/separator"
import { TurnstileWidget } from "./TurnstileWidget"
import { AuthProvider } from "@/types"

interface AuthFormProps {
  mode: "signin" | "signup"
  onToggleMode: () => void
  oauthMessage?: string | null
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C17 3.3 14.7 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12S6.7 21.7 12 21.7c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12Z" />
      <path fill="#34A853" d="M3.5 7.3 6.7 9.6C7.6 7.4 9.6 6 12 6c1.9 0 3.2.8 4 1.5l2.7-2.6C17 3.3 14.7 2.3 12 2.3c-3.7 0-6.9 2.1-8.5 5Z" />
      <path fill="#4A90E2" d="M12 21.7c2.6 0 4.8-.9 6.4-2.5l-3-2.5c-.8.6-1.9 1.1-3.4 1.1-3.9 0-5.2-2.6-5.5-3.9L3.4 16.3c1.6 3.1 4.8 5.4 8.6 5.4Z" />
      <path fill="#FBBC05" d="M6.5 13.9c-.1-.5-.2-1.2-.2-1.9s.1-1.3.2-1.9L3.4 7.7A9.7 9.7 0 0 0 2.4 12c0 1.5.4 3 1 4.3l3.1-2.4Z" />
    </svg>
  )
}

export function AuthForm({ mode, onToggleMode, oauthMessage }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [widgetKey, setWidgetKey] = useState(0)
  const [localError, setLocalError] = useState<string | null>(null)

  const { signIn, signUp, startOAuth, isLoading, error, clearError } = useAuthStore()
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  const isSignUp = mode === "signup"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (mode === "signup" && password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    if (isSignUp && !turnstileToken) {
      setLocalError("Complete the Turnstile challenge before creating an account")
      return
    }

    try {
      if (mode === "signin") {
        await signIn(email, password)
      } else {
        await signUp(email, password, turnstileToken!)
        setTurnstileToken(null)
        setWidgetKey((current) => current + 1)
      }
    } catch (error) {
        console.log(error)
    }
  }

  const handleOAuth = async (provider: AuthProvider) => {
    clearError()
    setLocalError(null)

    if (isSignUp && !turnstileSiteKey) {
      setLocalError("Set VITE_TURNSTILE_SITE_KEY before enabling OAuth sign up")
      return
    }

    if (isSignUp && !turnstileToken) {
      setLocalError("Complete the Turnstile challenge before continuing with OAuth")
      return
    }

    try {
      await startOAuth(provider, mode, isSignUp ? turnstileToken : null)
    } catch (oauthError) {
      console.error(oauthError)
      if (isSignUp) {
        setTurnstileToken(null)
        setWidgetKey((current) => current + 1)
      }
    }
  }

  useEffect(() => {
    clearError()
    setLocalError(null)
    setTurnstileToken(null)
    setWidgetKey((current) => current + 1)
  }, [clearError, mode])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? "Enter your details to create your account" : "Enter your credentials to access your workflows"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {oauthMessage && (
            <Alert className="mb-4">
              <AlertDescription>{oauthMessage}</AlertDescription>
            </Alert>
          )}

          {(error || localError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{localError ?? error}</AlertDescription>
            </Alert>
          )}

          {/* <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full" disabled={isLoading || (isSignUp && !turnstileSiteKey)} onClick={() => handleOAuth("google")}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
              <span className="ml-2">{isSignUp ? "Sign up with Google" : "Continue with Google"}</span>
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={isLoading || (isSignUp && !turnstileSiteKey)} onClick={() => handleOAuth("github")}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
              <span className="ml-2">{isSignUp ? "Sign up with GitHub" : "Continue with GitHub"}</span>
            </Button>
          </div> */}

          {/* <div className="my-6">
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs uppercase tracking-wide text-muted-foreground">
                Or use email
              </span>
            </div>
          </div> */}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                {password !== confirmPassword && confirmPassword && !localError && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>
            )}

            {isSignUp && turnstileSiteKey ? (
              <TurnstileWidget
                key={widgetKey}
                siteKey={turnstileSiteKey}
                onVerify={setTurnstileToken}
              />
            ) : isSignUp ? (
              <p className="text-sm text-destructive">
                VITE_TURNSTILE_SITE_KEY is missing. Signup and OAuth sign up cannot be completed until it is set.
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || (isSignUp && password !== confirmPassword) || (isSignUp && !turnstileSiteKey)}
            >
              {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={onToggleMode}
                className="font-medium text-primary hover:underline"
                disabled={isLoading}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
