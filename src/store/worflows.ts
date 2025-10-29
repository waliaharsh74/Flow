import { create } from "zustand"
import type { RFNode, RFEdge} from "../types"
import { workFlowApi } from "@/utils/api"

export interface WorkflowMetadata {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  userId: string
  isActive: boolean
}

export interface SavedWorkflow extends WorkflowMetadata {
  nodes: RFNode[]
  edges: RFEdge[]
  startNodeId?: string
}

type ActionResult<T = SavedWorkflow> = {
  success: boolean
  workflow?: T
  error?: string
}

type ListResult = {
  success: boolean
  error?: string
}

interface WorkflowsState {
  workflows: SavedWorkflow[]
  currentWorkflowId: string | null
  isLoading: boolean
  error: string | null
}

interface WorkflowsActions {
  loadWorkflows: () => Promise<ListResult>
  createWorkflow: (name: string, description?: string) => Promise<ActionResult>
  updateWorkflow: (id: string, updates: Partial<SavedWorkflow>) => Promise<ActionResult>
  deleteWorkflow: (id: string) => Promise<ActionResult>
  duplicateWorkflow: (id: string) => Promise<ActionResult>
  setCurrentWorkflow: (id: string | null) => void
  saveCurrentWorkflow: (nodes: RFNode[], edges: RFEdge[], startNodeId?: string) => Promise<ActionResult | null>
  loadWorkflow: (id: string) => SavedWorkflow | null
  clearError: () => void
  syncWithServer: () => Promise<ListResult>
}

const generateId = () => Math.random().toString(36).slice(2, 11)

type ApiWorkflow = {
  workflowId?: string
  id?: string
  workflowName?: string
  name?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  user?: string | { _id?: string }
  isActive?: boolean
  nodes?: RFNode[]
  edges?: RFEdge[]
  startNodeId?: string
  workflow?: ApiWorkflow
  data?: { workflow?: ApiWorkflow }
}

interface ApiWorkflowList {
  workflows?: ApiWorkflow[]
}

const mapFromApi = (workflow: ApiWorkflow | null | undefined): SavedWorkflow => {
  if (!workflow) {
    return {
      id: generateId(),
      name: "Untitled Workflow",
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "",
      isActive: false,
      nodes: [],
      edges: [],
      startNodeId: undefined,
    }
  }

  const payload = workflow.workflowId ? workflow : workflow.workflow ? workflow.workflow : workflow.data?.workflow
  const source = payload ?? workflow
  const baseNodes: RFNode[] = Array.isArray(workflow?.nodes) ? workflow.nodes : []
  const baseEdges: RFEdge[] = Array.isArray(workflow?.edges) ? workflow.edges : []

  return {
    id: source?.workflowId ?? source?.id ?? generateId(),
    name: source?.workflowName ?? source?.name ?? "Untitled Workflow",
    description: source?.description ?? "",
    createdAt: source?.createdAt ?? new Date().toISOString(),
    updatedAt: source?.updatedAt ?? new Date().toISOString(),
    userId: typeof source?.user === "string" ? source.user : source?.user?._id ?? "",
    isActive: source?.isActive ?? true,
    nodes: Array.isArray(source?.nodes) ? source.nodes : baseNodes,
    edges: Array.isArray(source?.edges) ? source.edges : baseEdges,
    startNodeId: source?.startNodeId ?? undefined,
  }
}

const buildApiPayload = (workflow: SavedWorkflow) => ({
  workflowName: workflow.name,
  description: workflow.description ?? "",
  nodes: workflow.nodes,
  edges: workflow.edges,
  startNodeId: workflow.startNodeId ?? "",
  isActive: workflow.isActive,
})

export const useWorkflowsStore = create<WorkflowsState & WorkflowsActions>((set, get) => ({
  workflows: [],
  currentWorkflowId: null,
  isLoading: false,
  error: null,

  loadWorkflows: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await workFlowApi.getWorkflows()
      const payload = Array.isArray(response)
        ? (response as ApiWorkflow[])
        : Array.isArray((response as ApiWorkflowList | undefined)?.workflows)
          ? ((response as ApiWorkflowList).workflows as ApiWorkflow[])
          : []
      const workflows = payload.map(mapFromApi)
      set({ workflows, isLoading: false })
      return { success: true }
    } catch (error) {
      console.error("Failed to load workflows", error)
      const message = error instanceof Error ? error.message : "Failed to load workflows"
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  createWorkflow: async (name, description) => {
    const id = generateId()
    const now = new Date().toISOString()
    const newWorkflow: SavedWorkflow = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      userId: "current-user",
      isActive: false,
      nodes: [],
      edges: [],
      startNodeId: undefined,
    }

    try {
      const payload = buildApiPayload(newWorkflow)
      const response = await workFlowApi.saveWorflowDb(
        id,
        payload.workflowName,
        payload.description,
        payload.nodes,
        payload.edges,
        payload.startNodeId,
        payload.isActive,
      )
      const savedWorkflow = mapFromApi(response ?? { ...newWorkflow, workflowId: id, workflowName: name })
      set((state) => ({
        workflows: [...state.workflows, savedWorkflow],
        currentWorkflowId: savedWorkflow.id,
        error: null,
      }))
      return { success: true, workflow: savedWorkflow }
    } catch (error) {
      console.error("Failed to create workflow", error)
      const message = error instanceof Error ? error.message : "Failed to create workflow"
      return { success: false, error: message }
    }
  },

  updateWorkflow: async (id, updates) => {
    const existing = get().workflows.find((workflow) => workflow.id === id)
    if (!existing) {
      const message = "Workflow not found"
      console.error(message)
      return { success: false, error: message }
    }

    const merged: SavedWorkflow = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    try {
      const payload = buildApiPayload(merged)
      await workFlowApi.updateWorkFlow(id, {
        workflowName: payload.workflowName,
        description: payload.description,
        nodes: payload.nodes,
        edges: payload.edges,
        startNodeId: payload.startNodeId,
        isActive: payload.isActive,
      })

      set((state) => ({
        workflows: state.workflows.map((workflow) => (workflow.id === id ? merged : workflow)),
        error: null,
      }))
      return { success: true, workflow: merged }
    } catch (error) {
      console.error("Failed to update workflow", error)
      const message = error instanceof Error ? error.message : "Failed to update workflow"
      return { success: false, error: message }
    }
  },

  deleteWorkflow: async (id) => {
    try {
      await workFlowApi.deleteWorkflow(id)
      set((state) => ({
        workflows: state.workflows.filter((workflow) => workflow.id !== id),
        currentWorkflowId: state.currentWorkflowId === id ? null : state.currentWorkflowId,
        error: null,
      }))
      return { success: true }
    } catch (error) {
      console.error("Failed to delete workflow", error)
      const message = error instanceof Error ? error.message : "Failed to delete workflow"
      return { success: false, error: message }
    }
  },

  duplicateWorkflow: async (id) => {
    const existing = get().workflows.find((workflow) => workflow.id === id)
    if (!existing) {
      const message = "Workflow not found"
      console.error(message)
      return { success: false, error: message }
    }

    const newId = generateId()
    const now = new Date().toISOString()
    const duplicated: SavedWorkflow = {
      ...existing,
      id: newId,
      name: `${existing.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      nodes: existing.nodes.map((node) => ({ ...node })),
      edges: existing.edges.map((edge) => ({ ...edge })),
    }

    try {
      const payload = buildApiPayload(duplicated)
      const response = await workFlowApi.saveWorflowDb(
        newId,
        payload.workflowName,
        payload.description,
        payload.nodes,
        payload.edges,
        payload.startNodeId,
        payload.isActive,
      )
      const savedWorkflow = mapFromApi(response ?? { ...duplicated, workflowId: newId, workflowName: duplicated.name })
      set((state) => ({
        workflows: [...state.workflows, savedWorkflow],
        currentWorkflowId: savedWorkflow.id,
        error: null,
      }))
      return { success: true, workflow: savedWorkflow }
    } catch (error) {
      console.error("Failed to duplicate workflow", error)
      const message = error instanceof Error ? error.message : "Failed to duplicate workflow"
      return { success: false, error: message }
    }
  },

  setCurrentWorkflow: (id) => {
    set({ currentWorkflowId: id })
  },

  saveCurrentWorkflow: async (nodes, edges, startNodeId) => {
    const { currentWorkflowId } = get()
    if (!currentWorkflowId) {
      return null
    }
    return get().updateWorkflow(currentWorkflowId, { nodes, edges, startNodeId })
  },

  loadWorkflow: (id) => {
    const workflow = get().workflows.find((w) => w.id === id)
    if (workflow) {
      set({ currentWorkflowId: id })
      return workflow
    }
    return null
  },



  clearError: () => {
    set({ error: null })
  },

  syncWithServer: async () => {
    return get().loadWorkflows()
  },
}))



