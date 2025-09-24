import { create } from "zustand"
import type { RFNode, RFEdge, ExportSchema, NodeKind } from "../types"
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
  exportWorkflow: (id: string) => ExportSchema | null
  importWorkflow: (name: string, schema: ExportSchema) => Promise<ActionResult>
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

type ExportConnection = { node: string; type: "main"; index: number }
type ExportConnections = Record<string, { main: ExportConnection[][] }>

const mapFromApi = (workflow: ApiWorkflow | null | undefined): SavedWorkflow => {
  if (!workflow) {
    return {
      id: generateId(),
      name: "Untitled Workflow",
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: "",
      isActive: true,
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
      isActive: true,
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

  exportWorkflow: (id) => {
    const workflow = get().workflows.find((w) => w.id === id)
    if (!workflow) return null

    const exportSchema: ExportSchema = {
      data: {
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        id: workflow.id,
        name: workflow.name,
        active: workflow.isActive,
        isArchived: false,
        nodes: workflow.nodes.map((node) => ({
          id: node.id,
          name: node.data.parameters.name,
          type: getNodeTypeMapping(node.data.kind),
          typeVersion: 2.2,
          position: [node.position.x, node.position.y],
          parameters: node.data.parameters,
          ...(node.data.credentials && { credentials: node.data.credentials }),
          ...(node.data.webhookId && { webhookId: node.data.webhookId }),
        })),
        connections: buildConnections(workflow.nodes, workflow.edges),
        settings: { executionOrder: "v1" },
        staticData: null,
        meta: { templateCredsSetupCompleted: true },
        pinData: {},
        versionId: generateId(),
        triggerCount: 0,
        tags: [],
        scopes: [
          "workflow:create",
          "workflow:delete",
          "workflow:execute",
          "workflow:list",
          "workflow:move",
          "workflow:read",
          "workflow:share",
          "workflow:update",
        ],
      },
    }

    return exportSchema
  },

    importWorkflow: async (name, schema) => {
    const id = generateId()
    const now = new Date().toISOString()

    const nodes: RFNode[] = schema.data.nodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: { x: node.position[0], y: node.position[1] },
      data: {
        kind: getKindFromType(node.type),
        name: node.name,
        parameters: node.parameters,
        ...(node.credentials && { credentials: node.credentials }),
        ...(node.webhookId && { webhookId: node.webhookId }),
      },
    }))

    const edges: RFEdge[] = []
    Object.entries(schema.data.connections).forEach(([sourceName, connections]) => {
      const sourceNode = nodes.find((n) => n.data.parameters.name === sourceName)
      if (!sourceNode) return

      connections.main.forEach((outputConnections, outputIndex) => {
        outputConnections.forEach((connection) => {
          const targetNode = nodes.find((n) => n.data.parameters.name === connection.node)
          if (!targetNode) return

          edges.push({
            id: generateId(),
            source: sourceNode.id,
            target: targetNode.id,
            ...(outputIndex > 0 && {
              data: {
                slot: outputIndex as 0 | 1,
                label: outputIndex === 0 ? "true" : "false",
              },
            }),
          })
        })
      })
    })

    const startNodeId = nodes.find((n) => n.data.kind.startsWith("trigger."))?.id

    const importedWorkflow: SavedWorkflow = {
      id,
      name,
      description: `Imported from ${schema.data.name}`,
      createdAt: now,
      updatedAt: now,
      userId: "current-user",
      isActive: true,
      nodes,
      edges,
      startNodeId,
    }

    try {
      const payload = buildApiPayload(importedWorkflow)
      const response = await workFlowApi.saveWorflowDb(
        id,
        payload.workflowName,
        payload.description,
        payload.nodes,
        payload.edges,
        payload.startNodeId,
        payload.isActive,
      )
      const savedWorkflow = mapFromApi(response ?? { ...importedWorkflow, workflowId: id, workflowName: name })
      set((state) => ({
        workflows: [...state.workflows, savedWorkflow],
        currentWorkflowId: savedWorkflow.id,
        error: null,
      }))
      return { success: true, workflow: savedWorkflow }
    } catch (error) {
      console.error("Failed to import workflow", error)
      const message = error instanceof Error ? error.message : "Failed to import workflow"
      return { success: false, error: message }
    }
  },

  clearError: () => {
    set({ error: null })
  },

    syncWithServer: async () => {
      return get().loadWorkflows()
    },
  }))

function getNodeTypeMapping(kind: string): string {
  const mapping: Record<string, string> = {
    "trigger.manual": "n8n-nodes-base.manualTrigger",
    "trigger.form": "n8n-nodes-base.formTrigger",
    "trigger.cron": "n8n-nodes-base.cron",
    "logic.if": "n8n-nodes-base.if",
    "action.telegram": "n8n-nodes-base.telegram",
    "action.email": "n8n-nodes-base.emailSend",
    "action.llm": "@n8n/n8n-nodes-langchain.lmChatOpenAI",
  }
  return mapping[kind] || kind
}

function getKindFromType(type: string): NodeKind {
  const mapping: Record<string, NodeKind> = {
    "n8n-nodes-base.manualTrigger": "trigger.manual",
    "n8n-nodes-base.formTrigger": "trigger.form",
    "n8n-nodes-base.cron": "trigger.cron",
    "n8n-nodes-base.if": "logic.if",
    "n8n-nodes-base.telegram": "action.telegram",
    "n8n-nodes-base.emailSend": "action.email",
    "@n8n/n8n-nodes-langchain.lmChatOpenAI": "action.llm",
    "@n8n/n8n-nodes-langchain.lmChatGoogleGemini": "action.llm",
    "@n8n/n8n-nodes-langchain.lmChatAnthropic": "action.llm",
  }
  return mapping[type]
}

function buildConnections(nodes: RFNode[], edges: RFEdge[]): ExportConnections {
  const connections: ExportConnections = {}

  nodes.forEach((node) => {
    const outgoingEdges = edges.filter((edge) => edge.source === node.id)

    if (outgoingEdges.length > 0) {
      const main: ExportConnection[][] = []

      if (node.data.kind === "logic.if") {
        main[0] = []
        main[1] = []

        outgoingEdges.forEach((edge) => {
          const targetNode = nodes.find((n) => n.id === edge.target)
          if (targetNode) {
            const slot = edge.data?.slot || 0
            main[slot].push({
              node: targetNode.data.parameters?.name,
              type: "main",
              index: 0,
            })
          }
        })
      } else {
        main[0] = outgoingEdges
          .map((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target)
            return targetNode
              ? {
                  node: targetNode.data.parameters?.name ?? targetNode.id,
                  type: "main" as const,
                  index: 0,
                }
              : null
          })
          .filter((connection): connection is ExportConnection => connection !== null)
      }

      connections[node.data.parameters?.name] = { main }
    }
  })

  return connections
}
