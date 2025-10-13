import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "./../components/ui/button"
import { Input } from "./../components/ui/input"
import { Label } from "./../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./../components/ui/card"
import { Badge } from "./../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./../components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./../components/ui/dropdown-menu"
import { Textarea } from "./../components/ui/textarea"
import { useWorkflowsStore } from "../store/worflows"
import { useAuthStore } from "../store/auth"
import { formatDistanceToNow } from "date-fns"
import { Plus, MoreVertical, Play, Copy, Trash2, Edit, FileDown, FileUp, LogOut, RefreshCcw, Rocket, PauseCircle, RotateCcw, Loader2, Activity, Trash, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toggle } from "@radix-ui/react-toggle"
import { Switch } from "./ui/switch"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import CredentialsPane from "./CredentialsPane"
import { useExecutionsStore } from "@/store/executions"
import { Execution, ExecutionStep } from "@/types"

interface WorkflowDashboardProps {
  onEditWorkflow: (workflowId: string) => void
}

export function WorkflowDashboard({ onEditWorkflow }: WorkflowDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState("")
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("")
  const [newExecutionWorkflowId, setNewExecutionWorkflowId] = useState("")
  const [newExecutionNodeId, setNewExecutionNodeId] = useState("")
  const [newExecutionPayload, setNewExecutionPayload] = useState("")
  const [importJson, setImportJson] = useState("")
  const [section, setSection] = useState<"workflows" | "credentials" | "executions">("workflows");

  const { toast } = useToast();


  const { workflows,
    isLoading,
    error,
    loadWorkflows,
    createWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    exportWorkflow,
    importWorkflow, clearError, updateWorkflow } =
    useWorkflowsStore()
  const { user, signOut } = useAuthStore()
   const {
    executions,
    executionSteps,
    stepDetails,
    selectedExecutionId,
    selectedStepId,
    isLoadingExecutions,
    isLoadingSteps,
    isMutatingExecution,
    isMutatingStep,
    error: executionsError,
    loadExecutions,
    selectExecution,
    createExecution,
    updateExecutionStatus,
    deleteExecution,
    retryExecutionStep,
    loadExecutionStepDetail,
    clearError: clearExecutionsError,
  } = useExecutionsStore()




  const hasWorkflows = useMemo(() => workflows.length > 0, [workflows])
  const hasExecutions = useMemo(() => executions.length > 0, [executions])
  const selectedExecution = useMemo<Execution | null>(() => {
    if (!selectedExecutionId) return null
    return executions.find((execution) => execution.id === selectedExecutionId) ?? null
  }, [executions, selectedExecutionId])
  const currentStep = useMemo<ExecutionStep | null>(() => {
    if (!selectedStepId) return null
    return stepDetails[selectedStepId] ?? executionSteps.find((step) => step.id === selectedStepId) ?? null
  }, [executionSteps, selectedStepId, stepDetails])


  const handleCreateWorkflow = useCallback(async () => {
    if (!newWorkflowName.trim()) return

    const result = await createWorkflow(newWorkflowName.trim(), newWorkflowDescription.trim() || undefined)

    if (result.success && result.workflow) {
      setNewWorkflowName("")
      setNewWorkflowDescription("")
      setShowCreateDialog(false)
      toast({
        title: "Saved!",
        description: "Workflow saved successfully",
      })
      onEditWorkflow(result.workflow.id)
    } else {
      toast({
        title: "Error!",
        description: result.error || "Can't create workflow! Please try again",
        variant: "destructive",
      })
    }
  }, [createWorkflow, newWorkflowDescription, newWorkflowName, onEditWorkflow, toast])


  const handleImportWorkflow = useCallback(async () => {
    try {
      const schema = JSON.parse(importJson)
      const result = await importWorkflow(schema.data.name || "Imported Workflow", schema)
      if (result.success && result.workflow) {
        setImportJson("")
        setShowImportDialog(false)
        toast({
          title: "Imported!",
          description: "Workflow imported successfully",
        })
        onEditWorkflow(result.workflow.id)
      } else {
        toast({
          title: "Error!",
          description: result.error || "Can't import workflow! Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to import workflow:", error)
      toast({
        title: "Error!",
        description: "Invalid workflow JSON",
        variant: "destructive",
      })
    }
  }, [importJson, importWorkflow, onEditWorkflow, toast])

  const handleDeleteWorkFlow = useCallback(
    async (workflowId: string) => {
      const result = await deleteWorkflow(workflowId)
      if (result.success) {
        toast({
          title: "Deleted!",
          description: "Workflow deleted successfully",
        })
      } else {
        toast({
          title: "Error!",
          description: result.error || "Can't delete workflow! Please try again",
          variant: "destructive",
        })
      }
    },
    [deleteWorkflow, toast],
  )

  const handleExportWorkflow = useCallback(
    (workflowId: string) => {
      const schema = exportWorkflow(workflowId)
      if (schema) {
        const blob = new Blob([JSON.stringify(schema, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${schema.data.name}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    },
    [exportWorkflow],
  )
    const handleCreateExecution = useCallback(async () => {
    if (!newExecutionWorkflowId.trim()) {
      toast({
        title: "Workflow required",
        description: "Please provide a workflow ID to create an execution.",
        variant: "destructive",
      })
      return
    }

    let parsedPayload: unknown = undefined
    if (newExecutionPayload.trim()) {
      try {
        parsedPayload = JSON.parse(newExecutionPayload)
      } catch (error) {
        toast({
          title: "Invalid payload",
          description: "Trigger payload must be valid JSON.",
          variant: "destructive",
        })
        return
      }
    }

    const result = await createExecution({
      workflowId: newExecutionWorkflowId.trim(),
      triggerNodeId: newExecutionNodeId.trim() || undefined,
      triggerPayload: parsedPayload,
    })

    if (result) {
      toast({
        title: "Execution created",
        description: "A new execution has been created successfully.",
      })
      setNewExecutionWorkflowId("")
      setNewExecutionNodeId("")
      setNewExecutionPayload("")
      await selectExecution(result.id)
    } else {
      toast({
        title: "Unable to create execution",
        description: executionsError ?? "Please try again",
        variant: "destructive",
      })
    }
  }, [createExecution, executionsError, newExecutionNodeId, newExecutionPayload, newExecutionWorkflowId, selectExecution, toast])

  const handleSelectExecution = useCallback(
    async (executionId: string) => {
      await selectExecution(executionId)
    },
    [selectExecution],
  )

  const handleUpdateExecutionStatus = useCallback(
    async (executionId: string, status: Execution["status"]) => {
      const updated = await updateExecutionStatus(executionId, status)
      if (updated) {
        toast({
          title: "Execution updated",
          description: `Execution status updated to ${status}.`,
        })
      } else {
        toast({
          title: "Unable to update execution",
          description: executionsError ?? "Please try again",
          variant: "destructive",
        })
      }
    },
    [executionsError, toast, updateExecutionStatus],
  )

  const handleDeleteExecution = useCallback(
    async (executionId: string) => {
      const confirmed = await deleteExecution(executionId)
      if (confirmed) {
        toast({
          title: "Execution deleted",
          description: "Execution has been deleted successfully.",
        })
      } else {
        toast({
          title: "Unable to delete execution",
          description: executionsError ?? "Please try again",
          variant: "destructive",
        })
      }
    },
    [deleteExecution, executionsError, toast],
  )

  const handleRetryStep = useCallback(
    async (executionId: string, nodeId: string) => {
      const success = await retryExecutionStep(executionId, nodeId)
      if (success) {
        toast({
          title: "Retry scheduled",
          description: "The step will run again shortly.",
        })
      } else {
        toast({
          title: "Unable to retry step",
          description: executionsError ?? "Please try again",
          variant: "destructive",
        })
      }
    },
    [executionsError, retryExecutionStep, toast],
  )

  const handleViewStep = useCallback(
    async (stepId: string) => {
      const result = await loadExecutionStepDetail(stepId)
      if (!result) {
        toast({
          title: "Unable to load step",
          description: executionsError ?? "Please try again",
          variant: "destructive",
        })
      }
    },
    [executionsError, loadExecutionStepDetail, toast],
  )

  const handleDuplicateWorkflow = useCallback(
    async (workflowId: string) => {
      const result = await duplicateWorkflow(workflowId)
      if (result.success && result.workflow) {
        toast({
          title: "Saved!",
          description: "Workflow duplicated successfully",
        })
        onEditWorkflow(result.workflow.id)
      } else {
        toast({
          title: "Error!",
          description: result.error || "Can't duplicate workflow! Please try again",
          variant: "destructive",
        })
      }
    },
    [duplicateWorkflow, onEditWorkflow, toast],
  )
  const handleExecuteWorkflow = useCallback(
    async (workflowId: string) => {
      const execution = await createExecution({ workflowId })
      if (execution) {
        toast({
          title: "Execution started",
          description: "The workflow is now running.",
        })
        setSection("executions")
        await selectExecution(execution.id)
      } else {
        toast({
          title: "Unable to execute workflow",
          description: executionsError ?? "Please try again",
          variant: "destructive",
        })
      }
    },
    [createExecution, executionsError, selectExecution, toast],
  )
  const handleToogleSwitch = useCallback(async (workflowId: string, isActive: boolean) => {
    try {
      const result = await updateWorkflow(workflowId, {

        isActive: !isActive,
      });
      if (result.success) {
        toast({
          title: 'Saved!',
          description: 'Workflow active status changed successfully'
        });
      }
    } catch (error) {
      toast({
        title: 'Error!',
        description: "Can't change the active status",
        variant: 'destructive'
      });
    }

  }, [toast, updateWorkflow])


  

  useEffect(() => {
    if (!user) return
    loadWorkflows().then((result) => {
      if (!result.success) {
        toast({
          title: "Error!",
          description: result.error || "Unable to load workflows",
          variant: "destructive",
        })
      }
    })
  }, [loadWorkflows, toast])

  useEffect(() => {
    if (!user) return
    if (section === "executions") {
      loadExecutions()
    }
  }, [loadExecutions, section, user])

  useEffect(() => {
    if (!executionsError) return
    toast({
      title: "Execution error",
      description: executionsError,
      variant: "destructive",
    })
    clearExecutionsError()
  }, [clearExecutionsError, executionsError, toast])

  useEffect(() => {
    if (!user) return
    if (error) {
      toast({
        title: "Error!",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <div className="mt-2 inline-flex rounded-xl border bg-white overflow-hidden">
              {(["workflows", "credentials", "executions"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={[
                    "px-4 py-2 text-sm font-medium transition",
                    section === s ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  ].join(" ")}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileUp className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Workflow</DialogTitle>
                    <DialogDescription>Paste your n8n workflow JSON to import it</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-json">Workflow JSON</Label>
                      <Textarea
                        id="import-json"
                        placeholder="Paste your workflow JSON here..."
                        value={importJson}
                        onChange={(e) => setImportJson(e.target.value)}
                        rows={10}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleImportWorkflow} disabled={!importJson.trim()}>
                        Import
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Workflow</DialogTitle>
                    <DialogDescription>Give your workflow a name and description</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="workflow-name">Name</Label>
                      <Input
                        id="workflow-name"
                        placeholder="Enter workflow name"
                        value={newWorkflowName}
                        onChange={(e) => setNewWorkflowName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="workflow-description">Description (optional)</Label>
                      <Textarea
                        id="workflow-description"
                        placeholder="Describe what this workflow does"
                        value={newWorkflowDescription}
                        onChange={(e) => setNewWorkflowDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateWorkflow} disabled={!newWorkflowName.trim()}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {section === "workflows" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-600">Loading workflows...</div>
        ) : !hasWorkflows ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
              <p className="text-gray-600 mb-6">Create your first workflow to get started with automation</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{workflow.name}</CardTitle>
                      {workflow.description && (
                        <CardDescription className="mt-1 line-clamp-2">{workflow.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExecuteWorkflow(workflow.id)}>
                          <Rocket className="w-4 h-4 mr-2" />
                          Execute
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditWorkflow(workflow.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {/* baad m add karenge */}
                        {/* <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem> */}
                        <DropdownMenuItem onClick={() => handleExportWorkflow(workflow.id)}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteWorkFlow(workflow.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>
                      {workflow.nodes.length} node{workflow.nodes.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center space-x-2">



                      <Label htmlFor="active-mode">{workflow.isActive ? "Active" : "Inactive"}</Label>
                      <Switch id="active-mode" checked={workflow.isActive} onClick={() => handleToogleSwitch(workflow.id, workflow.isActive)} >
                      </Switch>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                    </span>
                    <Button size="sm" onClick={() => onEditWorkflow(workflow.id)} className="ml-2">
                      <Play className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div> )}
      {section === "credentials" && <CredentialsPane />}
      {section === "executions" && (
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-4 w-4" /> Start execution
              </CardTitle>
              <CardDescription>Create a new execution by providing a workflow and optional trigger data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="execution-workflow">Workflow ID</Label>
                <Input
                  id="execution-workflow"
                  placeholder="workflow-id"
                  value={newExecutionWorkflowId}
                  onChange={(event) => setNewExecutionWorkflowId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="execution-node">Trigger node ID</Label>
                <Input
                  id="execution-node"
                  placeholder="node-id (optional)"
                  value={newExecutionNodeId}
                  onChange={(event) => setNewExecutionNodeId(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="execution-payload">Trigger payload (JSON)</Label>
                <Textarea
                  id="execution-payload"
                  placeholder="Enter key-value"
                  value={newExecutionPayload}
                  onChange={(event) => setNewExecutionPayload(event.target.value)}
                  className="min-h-[120px] font-mono"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button onClick={handleCreateExecution} disabled={isMutatingExecution}>
                  {isMutatingExecution ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                  Create execution
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Executions
                  </CardTitle>
                  <CardDescription>Browse and manage recent executions.</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => loadExecutions()}
                  disabled={isLoadingExecutions}
                >
                  {isLoadingExecutions ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <div className="divide-y">
                    {hasExecutions ? (
                      executions.map((execution) => {
                        const isSelected = execution.id === selectedExecutionId
                        return (
                          <button
                            key={execution.id}
                            type="button"
                            onClick={() => handleSelectExecution(execution.id)}
                            className={`w-full text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? "bg-muted" : ""}`}
                          >
                            <div className="px-4 py-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{execution.id}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Workflow: {execution.workflowId || "Unknown"}
                                  </p>
                                </div>
                                <Badge variant={execution.status === "FAILED" ? "destructive" : execution.status === "RUNNING" ? "default" : "secondary"}>
                                  {execution.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Created {formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true })}</span>
                                {execution.startedAt && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span>Started {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleSelectExecution(execution.id)
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                                {execution.status !== "RUNNING" && execution.status !== "COMPLETED" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      handleUpdateExecutionStatus(execution.id, "RUNNING")
                                    }}
                                  >
                                    <Play className="h-3 w-3 mr-1" /> Resume
                                  </Button>
                                )}
                                {execution.status === "RUNNING" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      handleUpdateExecutionStatus(execution.id, "CANCELED")
                                    }}
                                  >
                                    <PauseCircle className="h-3 w-3 mr-1" /> Cancel
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleDeleteExecution(execution.id)
                                  }}
                                >
                                  <Trash className="h-3 w-3 mr-1" /> Delete
                                </Button>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    ) : (
                      <div className="py-12 text-center text-sm text-muted-foreground">
                        {isLoadingExecutions ? "Loading executions..." : "No executions yet. Create one to get started."}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Execution details</CardTitle>
                <CardDescription>
                  {selectedExecution
                    ? `Inspect status and step history for execution ${selectedExecution.id}.`
                    : "Select an execution to view its details."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedExecution ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Workflow</p>
                          <p className="font-medium">{selectedExecution.workflowId || "Unknown"}</p>
                        </div>
                        <Badge variant={selectedExecution.status === "FAILED" ? "destructive" : selectedExecution.status === "RUNNING" ? "default" : "secondary"}>
                          {selectedExecution.status}
                        </Badge>
                      </div>
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        <span>Created {formatDistanceToNow(new Date(selectedExecution.createdAt), { addSuffix: true })}</span>
                        {selectedExecution.startedAt && (
                          <span>Started {formatDistanceToNow(new Date(selectedExecution.startedAt), { addSuffix: true })}</span>
                        )}
                        {selectedExecution.endedAt && (
                          <span>Ended {formatDistanceToNow(new Date(selectedExecution.endedAt), { addSuffix: true })}</span>
                        )}
                      </div>
                      {selectedExecution.error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                          {typeof selectedExecution.error === "string"
                            ? selectedExecution.error
                            : JSON.stringify(selectedExecution.error, null, 2)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Steps</h4>
                      <ScrollArea className="h-[260px] rounded-md border">
                        <div className="divide-y">
                          {isLoadingSteps ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Loading steps...</div>
                          ) : executionSteps.length ? (
                            executionSteps.map((step) => (
                              <div key={step.id} className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{step.nodeId}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {step.nodeType ? `Type: ${step.nodeType}` : "Type: Unknown"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Step ID: {step.id}</p>
                                  </div>
                                  <Badge variant={step.status === "FAILED" ? "destructive" : step.status === "RUNNING" ? "default" : "secondary"}>
                                    {step.status}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewStep(step.id)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" /> View details
                                  </Button>
                                  {step.status === "FAILED" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRetryStep(selectedExecution.id, step.nodeId)}
                                      disabled={isMutatingStep}
                                    >
                                      {isMutatingStep ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                      )}
                                      Retry step
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">No steps recorded yet.</div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {currentStep && (
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Eye className="h-4 w-4" /> Step details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>
                            <span className="font-medium text-foreground">Node ID:</span> {currentStep.nodeId}
                          </span>
                          <span>
                            <span className="font-medium text-foreground">Node type:</span> {currentStep.nodeType ?? "Unknown"}
                          </span>
                        </div>
                        <pre className="rounded-md bg-muted p-4 text-xs overflow-auto max-h-60">
                          {JSON.stringify(currentStep, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Select an execution from the list to view its details.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
