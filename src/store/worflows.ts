import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { RFNode, RFEdge, ExportSchema, NodeKind } from "../types"

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

interface WorkflowsState {
  workflows: SavedWorkflow[]
  currentWorkflowId: string | null
  isLoading: boolean
  error: string | null
}

interface WorkflowsActions {
  createWorkflow: (name: string, description?: string) => string
  updateWorkflow: (id: string, updates: Partial<SavedWorkflow>) => void
  deleteWorkflow: (id: string) => void
  duplicateWorkflow: (id: string) => string
  setCurrentWorkflow: (id: string | null) => void
  saveCurrentWorkflow: (nodes: RFNode[], edges: RFEdge[], startNodeId?: string) => void
  loadWorkflow: (id: string) => SavedWorkflow | null
  exportWorkflow: (id: string) => ExportSchema | null
  importWorkflow: (name: string, schema: ExportSchema) => string
  clearError: () => void
  syncWithServer: () => Promise<void>
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useWorkflowsStore = create<WorkflowsState & WorkflowsActions>()(
  persist(
    (set, get) => ({
      workflows: [],
      currentWorkflowId: null,
      isLoading: false,
      error: null,

      createWorkflow: (name: string, description?: string) => {
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

        set((state) => ({
          workflows: [...state.workflows, newWorkflow],
          currentWorkflowId: id,
        }))

        return id
      },

      updateWorkflow: (id: string, updates: Partial<SavedWorkflow>) => {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === id ? { ...workflow, ...updates, updatedAt: new Date().toISOString() } : workflow,
          ),
        }))
      },

      deleteWorkflow: (id: string) => {
        set((state) => ({
          workflows: state.workflows.filter((workflow) => workflow.id !== id),
          currentWorkflowId: state.currentWorkflowId === id ? null : state.currentWorkflowId,
        }))
      },

      duplicateWorkflow: (id: string) => {
        const workflow = get().workflows.find((w) => w.id === id)
        if (!workflow) return ""

        const newId = generateId()
        const now = new Date().toISOString()

        const duplicatedWorkflow: SavedWorkflow = {
          ...workflow,
          id: newId,
          name: `${workflow.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
          nodes: workflow.nodes.map((node) => ({
            ...node,
            id: generateId(),
          })),
          edges: workflow.edges.map((edge) => ({
            ...edge,
            id: generateId(),
          })),
        }

        set((state) => ({
          workflows: [...state.workflows, duplicatedWorkflow],
        }))

        return newId
      },

      setCurrentWorkflow: (id: string | null) => {
        set({ currentWorkflowId: id })
      },

      saveCurrentWorkflow: (nodes: RFNode[], edges: RFEdge[], startNodeId?: string) => {
        const { currentWorkflowId } = get()
        if (!currentWorkflowId) return

        get().updateWorkflow(currentWorkflowId, {
          nodes,
          edges,
          startNodeId,
        })
      },

      loadWorkflow: (id: string) => {
        const workflow = get().workflows.find((w) => w.id === id)
        if (workflow) {
          set({ currentWorkflowId: id })
        }
        return workflow || null
      },

      exportWorkflow: (id: string) => {
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

      importWorkflow: (name: string, schema: ExportSchema) => {
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

        set((state) => ({
          workflows: [...state.workflows, importedWorkflow],
        }))

        return id
      },

      clearError: () => {
        set({ error: null })
      },

      syncWithServer: async () => {
        set({ isLoading: true })
        try {
          console.log("Syncing workflows with server...")
          set({ isLoading: false })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Sync failed",
          })
        }
      },
    }),
    {
      name: "workflows-storage",
      partialize: (state) => ({
        workflows: state.workflows,
        currentWorkflowId: state.currentWorkflowId,
      }),
    },
  ),
)

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

function buildConnections(nodes: RFNode[], edges: RFEdge[]): Record<string, any> {
  const connections: Record<string, any> = {}

  nodes.forEach((node) => {
    const outgoingEdges = edges.filter((edge) => edge.source === node.id)

    if (outgoingEdges.length > 0) {
      const main: any[][] = []

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
                  node: targetNode.data.parameters?.name,
                  type: "main",
                  index: 0,
                }
              : null
          })
          .filter(Boolean)
      }

      connections[node.data.parameters?.name] = { main }
    }
  })

  return connections
}
