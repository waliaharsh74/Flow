import { useCallback, useEffect, useState } from "react"
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

interface WorkflowDashboardProps {
  onEditWorkflow: (workflowId: string) => void
}

export function WorkflowDashboard({ onEditWorkflow }: WorkflowDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState("")
  const [workflows, setWorkflows] = useState([])
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("")
  const [importJson, setImportJson] = useState("")
  const { toast } = useToast();


  const {  createWorkflow, deleteWorkflow, duplicateWorkflow, exportWorkflow, importWorkflow, loadWorkflow } =
    useWorkflowsStore()
  const { user, signOut } = useAuthStore()

  const handleCreateWorkflow = async () => {
    try {
      if (!newWorkflowName.trim()) return

      const id = createWorkflow(newWorkflowName.trim(), newWorkflowDescription.trim() || undefined)
      setNewWorkflowName("")
      setNewWorkflowDescription("")
      setShowCreateDialog(false)
      onEditWorkflow(id)
      const workflowData = loadWorkflow(id)
      const { name, nodes, edges, isActive, startNodeId, description } = workflowData
      const data = await workFlowApi.saveWorflowDb(id, name, description, nodes, edges, startNodeId, isActive)
      if (!data) {
        toast({
          title: 'Try Again!',
          description: "Can't save workflow"
        });
      }
      toast({
        title: 'Saved!',
        description: 'Workflow saved successfully'
      });

    } catch (error) {
      console.log('error in creating workflow', error)
      toast({
        title: 'Error!',
        description: "Can't create workflow! please try again"
      });
    }

  }

  const handleImportWorkflow = () => {
    try {
      const schema = JSON.parse(importJson)
      const id = importWorkflow(schema.data.name || "Imported Workflow", schema)
      setImportJson("")
      setShowImportDialog(false)
      onEditWorkflow(id)
    } catch (error) {
      console.error("Failed to import workflow:", error)
    }
  }

  const handleDeleteWorkFlow = async (workflowId: string) => {
    try {
      console.log(workflowId)
      deleteWorkflow(workflowId)
      const data = await workFlowApi.deleteWorkflow(workflowId)
      if (!data) {
        throw new Error("Can't delete the workspace")
      }

      toast({
        title: 'Deleted!',
        description: 'Workflow deleted successfully'
      });
    } catch (error) {
      console.log('error in deleting workflow', error)
      toast({
        title: 'Error!',
        description: "Can't delete workflow! please try again"
      });
    }
  }

  const handleExportWorkflow = (workflowId: string) => {
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
  }

  const handleDuplicateWorkflow = async (workflowId: string) => {
    try {


      const newId = duplicateWorkflow(workflowId)

      if (newId) {
        const workflowData = loadWorkflow(workflowId)
        const { name, nodes, edges, isActive, startNodeId, description } = workflowData
        const data = await workFlowApi.saveWorflowDb(newId, name, description, nodes, edges, startNodeId, isActive)
        if (!data) {
          toast({
            title: 'Try Again!',
            description: "Can't create workflow"
          });
        }
        toast({
          title: 'Saved!',
          description: 'Workflow saved successfully'
        });
        onEditWorkflow(newId)

      }
    } catch (error) {
      console.log('error in creating workflow', error)
      toast({
        title: 'Error!',
        description: "Can't create workflow! please try again"
      });
    }

  }
  const getWorkFlows= useCallback(async()=>{
    const res=await workFlowApi.getWorkflows()
    console.log("res",res)
    // console.log("workflows",workflows)
    setWorkflows(res)
  },[]) 

  useEffect(()=>{
    getWorkFlows()
  },[getWorkFlows])

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
        {workflows.length === 0 ? (
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
              <Card key={workflow.workflowId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{workflow.workflowName}</CardTitle>
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
                        <DropdownMenuItem onClick={() => onEditWorkflow(workflow.workflowId)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {/* baad m add karenge */}
                        {/* <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow.workflowId)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem> */}
                        <DropdownMenuItem onClick={() => handleExportWorkflow(workflow.workflowId)}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteWorkFlow(workflow.workflowId)} className="text-destructive">
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
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                    </span>
                    <Button size="sm" onClick={() => onEditWorkflow(workflow.workflowId)} className="ml-2">
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
