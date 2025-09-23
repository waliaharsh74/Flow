import { create } from "zustand"
import { persist } from "zustand/middleware"


interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  checkAuth: () => Promise<void>
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${API_BASE_URL}/sign-up`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.msg || "Sign in failed")
          }

          if (data.msg === "Login successful") {
         
            const user: User = {
              id: email, 
              email,
            }

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(data.msg || "Sign in failed")
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Sign in failed",
          })
          throw error
        }
      },

      signUp: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${API_BASE_URL}/sign-in`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.msg || "Sign up failed")
          }

          if (data.msg === "User created successfully") {
            set({
              isLoading: false,
              error: null,
            })
            await get().signIn(email, password)
          } else {
            throw new Error(data.msg || "Sign up failed")
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Sign up failed",
          })
          throw error
        }
      },

      signOut: async () => {
        set({ isLoading: true })

        try {
          await fetch(`${API_BASE_URL}/logout`, {
            method: "POST",
            credentials: "include",
          })
        } catch (error) {
          console.warn("Logout endpoint failed:", error)
        }

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      clearError: () => {
        set({ error: null })
      },

      checkAuth: async () => {
        set({ isLoading: true })

        try {
          const response = await fetch(`${API_BASE_URL}/me`, {
            credentials: "include",
          })

          if (response.ok) {
            const userData = await response.json()
            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
