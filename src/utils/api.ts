import { NodeKind, RFEdge, RFNode ,Credential} from "@/types"

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

  getExecutionSteps: (executionId: string) =>
    apiRequest(`/executions/${encodeURIComponent(executionId)}/steps`, {
      method: "GET",
    }),

  getExecutionStep: (stepId: string) =>
    apiRequest(`/execution-steps/${encodeURIComponent(stepId)}`, {
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

