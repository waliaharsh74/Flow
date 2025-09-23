const API_BASE_URL = process.env._API_URL || "http://localhost:3000/api/v1/"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    credentials: "include", 
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(response.status, errorData.msg || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, "Network error")
  }
}

    export const authApi = {
  signIn: (email: string, password: string) =>
    apiRequest("/sign-up", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signUp: (email: string, password: string) =>
    apiRequest("/sign-in", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signOut: () =>
    apiRequest("/logout", {
      method: "POST",
    }),

  getProfile: () => apiRequest("/me"),

  refreshToken: () =>
    apiRequest("/refresh-token", {
      method: "POST",
    }),
}
