import TopBar from "../components/TopBar";
import WorkflowBuilder from "../components/WorkflowBuilder";
import Palette from "../components/Palette";
import SidePanel from "../components/SidePanel";
import { AppState } from "@/types";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useWorkflowsStore } from "@/store/worflows";
import { WorkflowDashboard } from "@/components/WorkFlowDashboard";
import { AuthPage } from "@/components/AuthPage";
import { WorkflowEditor } from "@/components/WorkFlowEditor";

const Index = () => {

    // <div className="h-screen flex flex-col bg-workflow-canvas">
    //   <TopBar />
    //   <div className="flex-1 flex overflow-hidden">
    //     <Palette />
    //     <WorkflowBuilder />
    //     <SidePanel />
    //   </div>
    // </div>


    const [appState, setAppState] = useState<AppState>("loading")
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { setCurrentWorkflow } = useWorkflowsStore()

  // Check authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      setAppState(isAuthenticated ? "dashboard" : "auth")
    }

    initAuth()
  }, [checkAuth, isAuthenticated])

  // Update app state based on authentication
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (appState === "auth") {
          setAppState("dashboard")
        }
      } else {
        setAppState("auth")
        setCurrentWorkflowId(null)
      }
    }
  }, [isAuthenticated, isLoading, appState])

  const handleEditWorkflow = (workflowId: string) => {
    setCurrentWorkflowId(workflowId)
    setCurrentWorkflow(workflowId)
    setAppState("editor")
  }

  const handleBackToDashboard = () => {
    setCurrentWorkflowId(null)
    setCurrentWorkflow(null)
    setAppState("dashboard")
  }

  if (appState === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (appState === "auth") {
    return <AuthPage />
  }

  if (appState === "editor" && currentWorkflowId) {
    return <WorkflowEditor workflowId={currentWorkflowId} onBackToDashboard={handleBackToDashboard} />
  }

  return <WorkflowDashboard onEditWorkflow={handleEditWorkflow} />
  
};

export default Index;
