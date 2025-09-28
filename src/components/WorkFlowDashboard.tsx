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
import { Plus, MoreVertical, Play, Copy, Trash2, Edit, FileDown, FileUp, LogOut } from "lucide-react"
import { workFlowApi } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { Toggle } from "@radix-ui/react-toggle"
import { Switch } from "./ui/switch"

interface WorkflowDashboardProps {
  onEditWorkflow: (workflowId: string) => void
}

export function WorkflowDashboard({ onEditWorkflow }: WorkflowDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState("")
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("")
  const [importJson, setImportJson] = useState("")
  const { toast } = useToast();


  const {   workflows,
    isLoading,
    error,
    loadWorkflows,
    createWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    exportWorkflow,
    importWorkflow,clearError,updateWorkflow } =
    useWorkflowsStore()
  const { user, signOut } = useAuthStore()

  

 
  const hasWorkflows = useMemo(() => workflows.length > 0, [workflows])

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
  const handleToogleSwitch=useCallback(async(workflowId,isActive)=>{
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
          description:"Can't change the active status",
          variant: 'destructive'
        });
    }
       
  },[])

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
                    <Switch id="active-mode" checked={workflow.isActive}   onClick={()=>handleToogleSwitch(workflow.id,workflow.isActive )} >
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
      </div>
    </div>
  )
}
