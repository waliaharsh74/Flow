import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, ChevronDown, ChevronRight, Plus, X } from "lucide-react"
import { JsonTree } from "@/components/JsonTree"
import { RFNode } from "@/types"
import { useNavigate, useParams } from "react-router-dom"
import { useWorkflowStore } from "@/store/workflow"
import { useWorkflowsStore } from "@/store/worflows"
import { SelectGroup } from "@radix-ui/react-select"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@radix-ui/react-dialog"
import { DialogFooter, DialogHeader } from "./ui/dialog"
import { credentialApi } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Skeleton } from "@/components/ui/skeleton" 
export function ActionEditor() {
  const { nodeId, workflowId } = useParams<{nodeId: string; workflowId: string}>()
  const [showDialog, setShowDialog] = useState(false)
  const [credArr, setCredArr] = useState<any[]>([])
  const [credLoader, setCredLoader] = useState(true)
  const [upstreamChain, setUpstreamChain] = useState<RFNode[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)    
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const { nodes, getIncomingState } = useWorkflowStore()
  const { loadWorkflow, loadWorkflows, updateWorkflow } = useWorkflowsStore()

  const selectedNode = useMemo<RFNode | null>(() => {
    return nodes.find((n) => n.id === nodeId) ?? null
  }, [nodes, nodeId])

  const [formData, setFormData] = useState<Record<string, any>>({})
  const [credData, setCredData] = useState<Record<string, any>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setIsBootstrapping(true)
        await loadWorkflows()
        const workflow = loadWorkflow(workflowId!)
        if (workflow && !cancelled) {
          useWorkflowStore.setState({
            nodes: workflow.nodes,
            edges: workflow.edges,
            startNodeId: workflow.startNodeId,
            workflowName: workflow.name,
            selectedNodeId: nodeId,
          })
        }
      } catch (e) {
        console.error("error in getting workflow", e)
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadWorkflows, loadWorkflow, workflowId, nodeId])

  const handleIncoming = useCallback((nid: string, arr: RFNode[] = [], visited = new Set<string>()) => {
    if (visited.has(nid)) return arr
    visited.add(nid)
    const incomers = getIncomingState(nid)
    if (!Array.isArray(incomers) || incomers.length === 0) return arr
    for (const node of incomers) {
      if (!visited.has(node.id)) {
        arr.push(node as RFNode)
        handleIncoming(node.id, arr, visited)
      }
    }
    return arr
  }, [getIncomingState])

  const fetchCredentials = useCallback(async (kind: string) => {
    setCredLoader(true)
    try {
      const res = await credentialApi.getCredentials(kind)
      setCredArr(res?.credArr ?? [])
    } catch (e) {
      console.error("error in loading credentials", e)
      setCredArr([])
    } finally {
      setCredLoader(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedNode) return
    setFormData(selectedNode.data?.parameters ?? {})
    fetchCredentials(selectedNode.data.kind)
    setUpstreamChain(handleIncoming(selectedNode.id))
  }, [selectedNode, fetchCredentials, handleIncoming])

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowDialog(true)
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  const handleCredChange = (field: string, value: any) => {
    setCredData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveCred = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const kind = selectedNode?.data?.kind
      if (!kind) return
      const errors: string[] = []
      const req = (key: string, label: string) => { if (!credData[key]) errors.push(`${label} is required`) }

      if (!credData.name) errors.push("Credential name is required")
      if (kind === "action.email") { req("resendApi","Resend api token");  }
      if (kind === "action.telegram") { req("apiToken","Bot API Token") }
      if (kind === "action.llm") { req("apiKey","API Key"); req("provider","Provider") }

      if (errors.length) {
        toast({ title: "Missing fields", description: errors.join(", "), variant: "destructive" })
        return
      }

      const { name, ...other } = credData
      await credentialApi.createCredentials(kind, name, other)

      toast({ title: "Saved!", description: "Credentials saved successfully" })
      setShowDialog(false)
      setCredArr([])
      fetchCredentials(kind)
    } catch (error) {
      console.log(error)
      toast({ title: "Error!", description: "Cannot create credentials", variant: "destructive" })
    }
  }

  const handleSave = useCallback(async () => {
    if (!workflowId || !nodeId) return
    try {
      setIsSaving(true)
      const workflowData = loadWorkflow(workflowId)
      if (!workflowData) {
        toast({ title: "Error!", description: "Workflow not found", variant: "destructive" })
        return
      }

      const updatedNodes = workflowData.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                parameters: { ...(node.data?.parameters ?? {}), ...formData },
                credentials:formData?.credId?? ""
              },
            }
          : node
      )

      const result = await updateWorkflow(workflowId, { nodes: updatedNodes })
      if ((result as any)?.success) {
        toast({ title: "Success!", description: "Form saved successfully" })
      } else {
        toast({ title: "Error!", description: (result as any)?.error || "Can't Save WorkFlow", variant: "destructive" })
      }
    } catch (error) {
      console.log(error)
      toast({ title: "Error!", description: "Can't Save WorkFlow", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }, [formData, updateWorkflow, loadWorkflow, workflowId, nodeId, toast])

  const renderActionForm = (node: RFNode) => {
    const { kind, parameters } = node.data

    switch (kind) {
      case "action.email":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input id="to" value={formData.to ?? ""} onChange={(e) => handleFormChange("to", e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={formData.subject ?? ""} onChange={(e) => handleFormChange("subject", e.target.value)} placeholder="Email subject" />
            </div>
            <div>
              <Label htmlFor="text">Text Body</Label>
              <Textarea id="text" value={formData.text ?? ""} onChange={(e) => handleFormChange("text", e.target.value)} placeholder="Plain text version" rows={3} />
            </div>
          </div>
        )

      case "action.telegram":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="chatId">Chat ID</Label>
              <Input id="chatId" value={formData.chatId ?? ""} onChange={(e) => handleFormChange("chatId", e.target.value)} placeholder="@channel or chat_id" />
            </div>
            <div>
              <Label htmlFor="text">Message</Label>
              <Textarea id="text" value={formData.text ?? ""} onChange={(e) => handleFormChange("text", e.target.value)} placeholder="Your message here" rows={4} />
            </div>
          </div>
        )

      case "action.llm":
        return (
          <div className="space-y-4">
            {/* <div>
              <Label htmlFor="model">Model</Label>
              <Select value={formData.model ?? "gpt-4o-mini"} onValueChange={(v) => handleFormChange("model", v)}>
                <SelectTrigger><SelectValue placeholder="Pick a model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o mini</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
            <div>
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea id="systemPrompt" value={formData.systemPrompt ?? ""} onChange={(e) => handleFormChange("systemPrompt", e.target.value)} placeholder="You are a helpful assistant..." rows={3} />
            </div>
            <div>
              <Label htmlFor="userPrompt">User Prompt</Label>
              <Textarea id="userPrompt" value={formData.userPrompt ?? ""} onChange={(e) => handleFormChange("userPrompt", e.target.value)} placeholder="User's question or request" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input id="temperature" type="number" min="0" max="2" step="0.1" value={formData.temperature ?? 0.7}
                       onChange={(e) => handleFormChange("temperature", Number.parseFloat(e.target.value))}/>
              </div>
              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input id="maxTokens" type="number" value={formData.maxTokens ?? 1000}
                       onChange={(e) => handleFormChange("maxTokens", Number.parseInt(e.target.value))}/>
              </div>
            </div>
          </div>
        )

      case "logic.if":
        return (
          <div className="space-y-4">
            <div>
              <Label>Conditions</Label>
              <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                <JsonTree data={parameters?.conditions} id={node.id} />
              </div>
            </div>
          </div>
        )

      case "trigger.form":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="formTitle">Form Title</Label>
              <Input id="formTitle" value={formData.formTitle ?? parameters?.formTitle ?? ""} onChange={(e) => handleFormChange("formTitle", e.target.value)} placeholder="Contact Form" />
            </div>
            <div>
              <Label htmlFor="formDescription">Form Description</Label>
              <Textarea id="formDescription" value={formData.formDescription ?? parameters?.formDescription ?? ""} onChange={(e) => handleFormChange("formDescription", e.target.value)} placeholder="Brief description of the form" rows={2} />
            </div>
            <div>
              <Label>Form Elements</Label>
              <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                <JsonTree data={parameters?.elements} id={node.id} />
              </div>
            </div>
          </div>
        )

      default:
        return <div className="p-4 text-center text-muted-foreground">Unknown action type: {kind}</div>
    }
  }

    if (showDialog)
    return (

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md  m-auto mt-28  inset-0 w-fullflex items-center justify-center bg-white rounded-lg shadow-lg p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Create New Credential
            </DialogTitle>
            <DialogClose asChild>
              <button aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Fill in the form to create a new credential.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" >
            {(() => {
              switch (selectedNode.data.kind) {
                case "action.email":
                  return (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credential name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        placeholder="Enter name for your credentials"
                        onChange={(e) =>
                          handleCredChange("name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />

                      <label
                        htmlFor="resendApi"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
Resend api token                      </label>
                      <input
                        id="resendApi"
                        type="text"
                        required
                        placeholder="Axy****db"
                        onChange={(e) =>
                          handleCredChange("resendApi", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />

                      
                    </>
                  );

                case "action.telegram":
                  return (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credential name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        placeholder="Enter name for your credentials"
                        onChange={(e) =>
                          handleCredChange("name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <label
                        htmlFor="apiToken"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Bot API Token
                      </label>
                      <input
                        id="apiToken"
                        type="text"
                        required
                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        onChange={(e) =>
                          handleCredChange("apiToken", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </>
                  );

                case "action.llm":
                  return (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credential name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        placeholder="Enter name for your credentials"
                        onChange={(e) =>
                          handleCredChange("name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <label
                        htmlFor="apiKey"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        API Key
                      </label>
                      <input
                        id="apiKey"
                        type="text"
                        required
                        placeholder="sk-..."
                        onChange={(e) =>
                          handleCredChange("apiKey", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />

                      <label
                        htmlFor="provider"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Provider
                      </label>
                      <select
                        id="provider"
                        onChange={(e) =>
                          handleCredChange("provider", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="gemini">Gemini</option>
                        <option value="groq">Groq</option>
                      </select>
                    </>
                  );

                default:
                  return (
                    <div className="text-sm text-gray-500">
                      Unknown kind: {selectedNode.data.kind}
                    </div>
                  );
              }
            })()}

          </form>

          <DialogFooter className="mt-6 flex justify-end space-x-3">
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

            </DialogClose>
            <button
              type="submit"
              form="your-form-id"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={(e) => handleSaveCred(e)}            >
              save
            </button>

          </DialogFooter>
        </DialogContent>
      </Dialog>)

  const PanelSkeleton = () => (
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  )

  return (
    <div className="">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="grid grid-cols-3 gap-6 h-[800px]">
        <ResizablePanel defaultSize={50}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Inputs</CardTitle>
              <p className="text-sm text-muted-foreground">Upstream chain data</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[700px] overflow-y-auto">
                {isBootstrapping ? (
                  <PanelSkeleton />
                ) : !upstreamChain?.length ? (
                  <div className="p-4 text-center text-muted-foreground">No upstream nodes</div>
                ) : (
                  <div className="space-y-2">
                    {upstreamChain.map((node, index) => (
                      <Collapsible key={node.id} defaultOpen={index === upstreamChain.length - 1}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 border-b">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:hidden" />
                            <ChevronDown className="h-4 w-4 transition-transform hidden data-[state=open]:block" />
                            <span className="font-medium">{node.data.kind}</span>
                            <span className="text-xs text-muted-foreground">
                              ({node.data.parameters?.name ?? "unnamed"})
                            </span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-3">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Parameters</h4>
                              <JsonTree data={node.data.parameters} id={node.id} />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Edit Node</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[700px] overflow-y-auto">
              {isBootstrapping ? (
                <PanelSkeleton />
              ) : selectedNode ? (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h3 className="font-medium text-sm mb-1">Node Type</h3>
                    <p className="text-sm text-muted-foreground">{selectedNode.data.kind}</p>
                  </div>

                  <div>
                    <Label htmlFor="credentials">Credential to connect with</Label>
                    <Select value={formData?.credId ?? undefined} onValueChange={(v) => handleFormChange("credId", v)}>
                      <SelectTrigger className="w-[240px] mt-1">
                        <SelectValue placeholder="Select Credential" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <Button onClick={handleCreateClick}  className="w-full">
                            <Plus className="w-4 h-4 mr-1" />
                            Create new credential
                          </Button>
                          {credLoader ? (
                            <div className="p-2"><Skeleton className="h-5 w-40" /></div>
                          ) : credArr.length ? (
                            credArr.map((v: any) => (
                              <SelectItem key={v?._id} value={v?._id}>{v?.name}</SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">No credentials yet</div>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="name">name</Label>
                    <Input id="name" value={formData?.name ?? ""} onChange={(e) => handleFormChange("name", e.target.value)} placeholder="Name.." />
                  </div>

                  {renderActionForm(selectedNode)}
                  <Button onClick={handleSave} className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">No node selected</div>
              )}
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={40}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Outputs</CardTitle>
              <p className="text-sm text-muted-foreground">Node execution results</p>
            </CardHeader>
            <CardContent className="max-h-[700px] overflow-y-auto">
              {isBootstrapping ? (
                <PanelSkeleton />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Outputs will appear here after node execution</p>
                  <div className="mt-4 p-4 border-2 border-dashed border-muted rounded-lg">
                    <p className="text-xs">Ready to display execution results</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
