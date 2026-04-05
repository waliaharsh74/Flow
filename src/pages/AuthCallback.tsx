import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth"

function buildAuthRedirect(searchParams: URLSearchParams) {
  const nextParams = new URLSearchParams()

  const message =
    searchParams.get("message") ??
    searchParams.get("error_description") ??
    searchParams.get("error") ??
    searchParams.get("oauth_error")

  if (message) {
    nextParams.set("message", message)
  }

  const serialized = nextParams.toString()
  return serialized ? `/auth?${serialized}` : "/auth"
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeOAuth } = useAuthStore()

  useEffect(() => {
    const finalizeOAuth = async () => {
      const hasError =
        searchParams.has("error") ||
        searchParams.has("oauth_error") ||
        searchParams.get("status") === "conflict"

      if (hasError) {
        navigate(buildAuthRedirect(searchParams), { replace: true })
        return
      }

      try {
        await completeOAuth()
        if (searchParams.get("mode") === "link") {
          const nextParams = new URLSearchParams()
          const provider = searchParams.get("provider")

          nextParams.set(
            "message",
            provider
              ? `${provider[0].toUpperCase()}${provider.slice(1)} account linked successfully`
              : "OAuth account linked successfully",
          )

          navigate(`/auth?${nextParams.toString()}`, { replace: true })
          return
        }

        navigate("/auth", { replace: true })
      } catch {
        navigate(buildAuthRedirect(searchParams), { replace: true })
      }
    }

    void finalizeOAuth()
  }, [completeOAuth, navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Finalizing authentication...</p>
      </div>
    </div>
  )
}
