
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Workflow, X } from "lucide-react"
import { JsonTree } from "@/components/JsonTree"
import { RFNode } from "@/types"
import { useNavigate, useParams } from "react-router-dom"
import { useWorkflowStore } from "@/store/workflow"
import { useWorkflowsStore } from "@/store/worflows"
import { SelectGroup, SelectLabel } from "@radix-ui/react-select"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { DialogFooter, DialogHeader } from "./ui/dialog"
import { credentialApi } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"






export function ActionEditor() {
  const { nodeId, workflowId } = useParams();
  const [showDialog, setShowDialog] = useState(false);
  const [credArr, setCredArr] = useState([])
  const [credLoader, setCredLoader] = useState(true)
  const { toast } = useToast();
  const navigate = useNavigate()



  const handleCreateClick = (e) => {
    e.preventDefault();
    setShowDialog(true);
  };

  const handleSaveCred = async (e) => {
    e.preventDefault();
    try {
      const { kind } = selectedNode.data;
      const errors: string[] = [];
      switch (kind) {
        case "action.email":
          if (!credData.name) errors.push("Credential name is required");
          if (!credData.email) errors.push("Email is required");
          if (!credData.password) errors.push("Password is required");
          break;

        case "action.telegram":
          if (!credData.name) errors.push("Credential name is required");

          if (!credData.apiToken) errors.push("Bot API Token is required");
          break;

        case "action.llm":
          if (!credData.name) errors.push("Credential name is required");

          if (!credData.apiKey) errors.push("API Key is required");
          if (!credData.provider) errors.push("Provider is required");
          break;

        default:
          errors.push("Unsupported kind");
          break;
      }
      if (errors.length > 0) {
        toast({
          title: "Missing fields",
          description: errors.join(", "),
          variant: "destructive",
        });
        return;
      }
      const { name, ...other } = credData
      const res = await credentialApi.createCredentials(kind, name, other)
      console.log(res)



      toast({
        title: 'Saved!',
        description: 'Credentials saved successfully'
      });
      setShowDialog(false)
      setCredArr([])
    } catch (error) {
      console.log(error)
      toast({
        title: 'Error!',
        description: 'Cannot create credentials',
        variant: 'destructive'
      });
      return
    }


  }

  const { selectedNodeId, nodes, edges, startNodeId, workflowName, getIncomingState } = useWorkflowStore()
  const { loadWorkflow, saveCurrentWorkflow, updateWorkflow, loadWorkflows } = useWorkflowsStore()

  const fetchData = useCallback(async () => {
    try {
      await loadWorkflows()
      const workflow = loadWorkflow(workflowId)
      if (workflow) {
        useWorkflowStore.setState({
          nodes: workflow.nodes,
          edges: workflow.edges,
          startNodeId: workflow.startNodeId,
          workflowName: workflow.name,
          selectedNodeId: undefined,
        })
      }
    } catch (error) {
      console.log('error in getting workflow', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [workflowId, loadWorkflow])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [credData, setCredData] = useState<Record<string, any>>({})


  const selectedNode = nodes.find((node) => node.id === nodeId)



  const handleIncoming = (nodeId, arr = [], visited = new Set()) => {
    if (visited.has(nodeId)) {
      console.log(arr)
      return arr;
    }

    visited.add(nodeId);

    const incomers = getIncomingState(nodeId);
    if (!Array.isArray(incomers) || incomers.length === 0) {
      return arr;
    }

    for (const node of incomers) {
      if (!visited.has(node.id)) {
        arr.push(node);
        handleIncoming(node.id, arr, visited);
      }
    }

    return arr;
  };

  const upstreamChain = handleIncoming(nodeId)
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }
  const handleCredChange = (field: string, value: any) => {
    setCredData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGetCredentials = async (kind) => {
    try {
      if (credArr.length > 0) return
      const res = await credentialApi.getCredentials(kind);

      setCredArr(res?.credArr)
      setCredLoader(false)

    } catch (error) {
      console.log('error in loading credentials')
      setCredLoader(false)

    }
  }

  const renderActionForm = (node: RFNode) => {

    const { kind, parameters, credentials } = node.data

    switch (kind) {
      case "action.email":
        return (
          <div className="space-y-4">

            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={formData.to || parameters.to || ""}
                onChange={(e) => handleFormChange("to", e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject || parameters.subject || ""}
                onChange={(e) => handleFormChange("subject", e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="text">Text Body</Label>
              <Textarea
                id="text"
                value={formData.text || parameters.text || ""}
                onChange={(e) => handleFormChange("text", e.target.value)}
                placeholder="Plain text version"
                rows={3}
              />
            </div>

          </div>
        )

      case "action.telegram":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                value={formData.chatId || parameters.chatId || ""}
                onChange={(e) => handleFormChange("chatId", e.target.value)}
                placeholder="@channel or chat_id"
              />
            </div>
            <div>
              <Label htmlFor="text">Message</Label>
              <Textarea
                id="text"
                value={formData.text || parameters.text || ""}
                onChange={(e) => handleFormChange("text", e.target.value)}
                placeholder="Your message here"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="parseMode">Parse Mode</Label>
              <Select value={formData.parseMode || parameters.parseMode || "HTML"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="Markdown">Markdown</SelectItem>
                  <SelectItem value="MarkdownV2">MarkdownV2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "action.llm":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <Select value={formData.model || parameters.model || "gpt-3.5-turbo"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt || parameters.systemPrompt || ""}
                onChange={(e) => handleFormChange("systemPrompt", e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="userPrompt">User Prompt</Label>
              <Textarea
                id="userPrompt"
                value={formData.userPrompt || parameters.userPrompt || ""}
                onChange={(e) => handleFormChange("userPrompt", e.target.value)}
                placeholder="User's question or request"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature || parameters.temperature || 0.7}
                  onChange={(e) => handleFormChange("temperature", Number.parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={formData.maxTokens || parameters.maxTokens || 1000}
                  onChange={(e) => handleFormChange("maxTokens", Number.parseInt(e.target.value))}
                />
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
                <JsonTree data={parameters.conditions} id={node.id} />
              </div>
            </div>
          </div>
        )

      case "trigger.form":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="formTitle">Form Title</Label>
              <Input
                id="formTitle"
                value={formData.formTitle || parameters.formTitle || ""}
                onChange={(e) => handleFormChange("formTitle", e.target.value)}
                placeholder="Contact Form"
              />
            </div>
            <div>
              <Label htmlFor="formDescription">Form Description</Label>
              <Textarea
                id="formDescription"
                value={formData.formDescription || parameters.formDescription || ""}
                onChange={(e) => handleFormChange("formDescription", e.target.value)}
                placeholder="Brief description of the form"
                rows={2}
              />
            </div>
            <div>
              <Label>Form Elements</Label>
              <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                <JsonTree data={parameters.elements} id={node.id} />
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
                        placeholder="email credentials"
                        onChange={(e) =>
                          handleCredChange("name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />

                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        onChange={(e) =>
                          handleCredChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />

                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        required
                        placeholder="********"
                        onChange={(e) =>
                          handleCredChange("password", e.target.value)
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
                        placeholder="email credentials"
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
                        placeholder="email credentials"
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
                        <option value="custom">Custom</option>
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


  return (
    <div className="">
      <div className="container mx-auto px-4 py-4 max-w-7xl">

        <Button className='' variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-6 h-[800px]">


        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Inputs</CardTitle>

            <p className="text-sm text-muted-foreground">Upstream chain data</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[700px] overflow-y-auto">
              {upstreamChain && upstreamChain.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No upstream nodes</div>
              ) : (
                <div className="space-y-2">
                  {upstreamChain && upstreamChain?.map((node, index) => (
                    <Collapsible key={node.id} defaultOpen={index === upstreamChain.length - 1}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 border-b">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:hidden" />
                          <ChevronDown className="h-4 w-4 transition-transform hidden data-[state=open]:block" />
                          <span className="font-medium">{node.data.kind}</span>
                          <span className="text-xs text-muted-foreground">({node.data.parameters.name})</span>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Parameters</h4>
                            <div className="bg-muted/30 rounded p-2">
                              <JsonTree data={node.data.parameters} id={node.id} />
                            </div>
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

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Edit Node</CardTitle>
            <div className="flex items-center gap-2">

            </div>
          </CardHeader>
          <CardContent className="max-h-[700px] overflow-y-auto">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h3 className="font-medium text-sm mb-1">Node Type</h3>
                  <p className="text-sm text-muted-foreground">{selectedNode.data.kind}</p>
                </div>
                <div>
                  <Select onOpenChange={(open) => open && handleGetCredentials(selectedNode.data.kind)}>
                    <Label htmlFor="credentials">Credential to connect with
                    </Label>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Credential" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <Button onClick={handleCreateClick} size="sm">
                          <Plus />
                          Create new credential
                        </Button>
                        {
                          (!credLoader) ?
                            credArr.map((v, i) => {

                              return (
                                <SelectItem value="apple">{v?.name}</SelectItem>

                              )
                            }) :
                            (
                              <div>loading...</div>
                            )

                        }

                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                {renderActionForm(selectedNode)}
                <Button onClick={() => console.log(formData)} className="w-full mt-6">Save Changes</Button>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">No node selected</div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Outputs</CardTitle>
            <p className="text-sm text-muted-foreground">Node execution results</p>
          </CardHeader>
          <CardContent className="max-h-[700px] overflow-y-auto">
            <div className="p-4 text-center text-muted-foreground">
              <p>Outputs will appear here after node execution</p>
              <div className="mt-4 p-4 border-2 border-dashed border-muted rounded-lg">
                <p className="text-xs">Ready to display execution results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




