"use client"

import { useEffect } from "react"
import SidePanel  from "./SidePanel"
import TopBar  from "./TopBar"
import  Palette  from "./Palette"
import { useWorkflowStore } from "../store/workflow"
import { useWorkflowsStore } from "../store/worflows"
import  {Button}  from "./ui/button"
import { ArrowLeft } from "lucide-react"
import WorkflowBuilder from "./WorkflowBuilder"

interface WorkflowEditorProps {
  workflowId: string
  onBackToDashboard: () => void
}

export function WorkflowEditor({ workflowId, onBackToDashboard }: WorkflowEditorProps) {
  const { selectedNodeId, nodes, edges, startNodeId, workflowName } = useWorkflowStore()
  const { loadWorkflow, saveCurrentWorkflow, updateWorkflow } = useWorkflowsStore()

  useEffect(() => {
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
  }, [workflowId, loadWorkflow])

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      saveCurrentWorkflow(nodes, edges, startNodeId)
    }, 1000) 

    return () => clearTimeout(saveTimer)
  }, [nodes, edges, startNodeId, saveCurrentWorkflow])

  useEffect(() => {
    updateWorkflow(workflowId, { name: workflowName })
  }, [workflowName, workflowId, updateWorkflow])

  const hasTrigger = nodes.some((node) => node.data.kind.startsWith("trigger."))

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <TopBar workflowId={workflowId}/>
        </div>
      </div>

      <div className="flex-1 flex">
          <Palette />
      

        <WorkflowBuilder />
        

        {selectedNodeId && (
            <SidePanel />
          
        )}
      </div>
    </div>
  )
}
