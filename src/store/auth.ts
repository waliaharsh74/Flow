import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthMode, AuthProvider, AuthUser } from "@/types"
import { authApi } from "@/utils/api"

function normalizeUser(user: AuthUser & { linkedProviders?: Array<AuthProvider | { provider: AuthProvider; email?: string; providerUserId?: string }> }) {
  const providers =
    user.providers ??
    user.authProviders ??
    user.linkedProviders?.map((provider) =>
      typeof provider === "string" ? { provider } : provider,
    ) ??
    []

  return {
    ...user,
    providers,
  }
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, turnstileToken: string) => Promise<void>
  startOAuth: (provider: AuthProvider, mode: AuthMode, turnstileToken?: string | null) => Promise<void>
  linkOAuthProvider: (provider: AuthProvider) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<void>
  completeOAuth: () => Promise<void>
}

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
          await authApi.login(email, password)
          const user = normalizeUser(await authApi.getProfile())

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Sign in failed",
          })
          throw error
        }
      },

      signUp: async (email: string, password: string, turnstileToken: string) => {
        set({ isLoading: true, error: null })

        try {
          await authApi.register(email, password, turnstileToken)
          const user = normalizeUser(await authApi.getProfile())

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Sign up failed",
          })
          throw error
        }
      },

      startOAuth: async (provider: AuthProvider, mode: AuthMode, turnstileToken?: string | null) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.startOAuth(provider, mode, turnstileToken)
          const redirectUrl =
            response.url ?? response.redirectUrl ?? response.authorizationUrl ?? response.authUrl

          if (!redirectUrl) {
            throw new Error("OAuth redirect URL was not returned by the server")
          }

          window.location.assign(redirectUrl)
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "OAuth sign in failed",
          })
          throw error
        }
      },

      linkOAuthProvider: async (provider: AuthProvider) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.startOAuthLink(provider)
          const redirectUrl =
            response.url ?? response.redirectUrl ?? response.authorizationUrl ?? response.authUrl

          if (!redirectUrl) {
            throw new Error("OAuth redirect URL was not returned by the server")
          }

          window.location.assign(redirectUrl)
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unable to link provider",
          })
          throw error
        }
      },

      signOut: async () => {
        set({ isLoading: true })

        try {
          await authApi.signOut()
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
          const userData = normalizeUser(await authApi.getProfile())
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
      refreshToken: async () => {
        set({ isLoading: true })

        try {
          await authApi.refreshToken()
          set({
            isLoading: false,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "failed to refresh token",
          })
          throw error
        }

      },

      completeOAuth: async () => {
        set({ isLoading: true, error: null })

        try {
          const user = normalizeUser(await authApi.getProfile())
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : "OAuth sign in failed",
          })
          throw error
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
