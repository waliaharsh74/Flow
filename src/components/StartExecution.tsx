import { Loader2, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "react-day-picker";
import { useExecutionsStore } from "@/store/executions";
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "./ui/label";

export default function StartExecution(){

     const [newExecutionWorkflowId, setNewExecutionWorkflowId] = useState("")
      const [newExecutionNodeId, setNewExecutionNodeId] = useState("")
      const [newExecutionPayload, setNewExecutionPayload] = useState("")
        const { toast } = useToast();

      const {
        isMutatingExecution,
        error: executionsError,
        selectExecution,
        createExecution,
      } = useExecutionsStore()
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
    
return(
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
)
}