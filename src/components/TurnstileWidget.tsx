import { useEffect, useId, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
          theme?: "light" | "dark" | "auto"
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script"
let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve()
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.id = TURNSTILE_SCRIPT_ID
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Unable to load Cloudflare Turnstile"))
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

interface TurnstileWidgetProps {
  siteKey: string
  onVerify: (token: string | null) => void
  className?: string
}

export function TurnstileWidget({ siteKey, onVerify, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const widgetDomId = useId().replace(/:/g, "-")

  useEffect(() => {
    let active = true

    loadTurnstileScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile) {
          return
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
          callback: (token) => onVerify(token),
          "expired-callback": () => onVerify(null),
          "error-callback": () => onVerify(null),
        })
      })
      .catch(() => {
        onVerify(null)
      })

    return () => {
      active = false
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [onVerify, siteKey])

  return <div id={widgetDomId} ref={containerRef} className={className} />
}
