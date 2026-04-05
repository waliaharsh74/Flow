import { AuthMode, AuthProvider, AuthUser, NodeKind, RFEdge, RFNode ,Credential} from "@/types"

const API_BASE_URL = import.meta.env.VITE_API_URL

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
    const data = await parseResponseBody(response)

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null && "msg" in data
          ? String(data.msg)
          : `HTTP ${response.status}`
      throw new ApiError(response.status, message)
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, "Network error")
  }
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return text ? { msg: text } : {}
}

export async function apiRequestRaw<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    const data = await parseResponseBody(response)

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null && "msg" in data
          ? String(data.msg)
          : `HTTP ${response.status}`
      throw new ApiError(response.status, message)
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, "Network error")
  }
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, turnstileToken: string) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, turnstileToken }),
    }),

  signOut: () =>
    apiRequestRaw("/auth/logout", {
      method: "POST",
    }),

  getProfile: () => apiRequest<AuthUser>("/auth/me"),

  refreshToken: () =>
    apiRequestRaw("/auth/refresh-token", {
      method: "POST",
    }),

  startOAuth: (provider: AuthProvider, intent: AuthMode, turnstileToken?: string | null) =>
    apiRequestRaw<{ url?: string; redirectUrl?: string; authorizationUrl?: string; authUrl?: string }>(
      `/auth/oauth/${provider}/start`,
      {
        method: "POST",
        body: JSON.stringify({ intent, turnstileToken }),
      },
    ),

  startOAuthLink: (provider: AuthProvider) =>
    apiRequestRaw<{ url?: string; redirectUrl?: string; authorizationUrl?: string; authUrl?: string }>(
      `/auth/oauth/${provider}/link-start`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    ),
}

export const workFlowApi = {
  saveWorflowDb: (id: string, workflowName: string, description: string, nodes: RFNode[], edges: RFEdge[], startNodeId: string, isActive: boolean) =>
    apiRequest("/workflows", {
      method: "POST",
      body: JSON.stringify({ id, workflowName, description, nodes, edges, startNodeId, isActive }),
    }),

  getWorkflows: () =>
    apiRequest("/workflows", {
      method: "GET",
    }),

  getWorflow: (id: string) =>
    apiRequest(`/workflows/${id}`, {
      method: "GET",
    })
  ,

  updateWorkFlow: (id: string, reqObj) =>
    apiRequest(`/workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify(reqObj)
    })
  ,
  deleteWorkflow: (id: string) =>
    apiRequest(`/workflows/${id}`, {
      method: "DELETE"
    }),

  getForm: (id: string) =>
    apiRequest(`/workflows/form/${id}`, {
      method: "GET",
    })
  ,
  ActionContextResponse: (workflowId: string, nodeId: string) =>
    apiRequest(`/workflows/${workflowId}/action-context/${nodeId}`, {
      method: "GET",
    })
  ,



}

export const credentialApi = {
  createCredentials: (kind: Partial<NodeKind>, name: string, secrets: object) =>
    apiRequest('/credentials', {
      method: "POST",
      body: JSON.stringify({ kind, name, secrets })
    }),
  getCredentials: (kind?: NodeKind) =>
    apiRequest(`/credentials${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`, {
      method: "GET",
    }),
  getCredentialById: (id: string, kind?: NodeKind) =>
    apiRequest(`/credentials/${encodeURIComponent(id)}${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`, {
      method: "GET",
    }),
  updateCredential: (id: string, body: Partial<Credential>) =>
    apiRequest(`/credentials/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
    deleteCredential: (id: string) =>
    apiRequest(`/credentials/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

}

type ExecutionQuery = {
  page?: number;
  limit?: number;
  status?: string;
  workflowId?: string;
};

type ExecutionCreatePayload = {
  workflowId: string;
  triggerNodeId?: string;
  triggerPayload?: unknown;
};

type ExecutionStatusUpdate = {
  status: string;
};

export const executionApi = {
  executeFormTrigger: (workflowId: string, nodeId: string, payload: any) =>
    apiRequest(`/triggers/form/${workflowId}/${nodeId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createExecution: (payload: ExecutionCreatePayload) =>
    apiRequest("/executions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listExecutions: (query: ExecutionQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    const search = params.toString();
    return apiRequest(`/executions${search ? `?${search}` : ""}`, {
      method: "GET",
    });
  },

  getExecution: (id: string) =>
    apiRequest(`/executions/${encodeURIComponent(id)}`, {
      method: "GET",
    }),

  updateExecutionStatus: (id: string, status: ExecutionStatusUpdate) =>
    apiRequest(`/executions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(status),
    }),

  deleteExecution: (id: string) =>
    apiRequest(`/executions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),



  getExecutionStep: (stepId: string) =>
    apiRequest(`/executions/steps/${encodeURIComponent(stepId)}`, {
      method: "GET",
    }),

  retryExecutionStep: (executionId: string, nodeId: string) =>
    apiRequest(`/executions/${encodeURIComponent(executionId)}/steps/${encodeURIComponent(nodeId)}/retry`, {
      method: "POST",
    }),

  runManualTrigger: (workflowId: string, nodeId: string, context?: unknown) =>
    apiRequest(`/triggers/manual/${workflowId}/${nodeId}/run`, {
      method: "POST",
      body: JSON.stringify({ context }),
    }),

  runCronTrigger: (workflowId: string, nodeId: string, now?: string) =>
    apiRequest(`/triggers/cron/${workflowId}/${nodeId}/run`, {
      method: "POST",
      body: JSON.stringify({ now }),
    }),
};

