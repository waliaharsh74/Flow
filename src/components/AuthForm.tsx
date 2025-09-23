"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./../components/ui/button"
import { Input } from "./../components/ui/input"
import { Label } from "./../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./../components/ui/card"
import { Alert, AlertDescription } from "./../components/ui/alert"
import { useAuthStore } from "../store/auth"

interface AuthFormProps {
  mode: "signin" | "signup"
  onToggleMode: () => void
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const { signIn, signUp, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (mode === "signup" && password !== confirmPassword) {
      return
    }

    try {
      if (mode === "signin") {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (error) {
        console.log(error)
    }
  }

  const isSignUp = mode === "signup"

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                {password !== confirmPassword && confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || (isSignUp && password !== confirmPassword)}>
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
