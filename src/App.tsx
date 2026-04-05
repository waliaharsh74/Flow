import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";

import FormBuilder from "./components/FormBuilder";
import { SessionProvider } from "./components/SessionProvider";
import { Suspense } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LiveForm from "./components/LiveForm";
import { ActionEditor } from "./components/ActionEditor";
import { WorkflowEditor } from "./components/WorkFlowEditor";
import AuthCallback from "./pages/AuthCallback";


const App = () => (
  <SessionProvider>
    <Suspense fallback={<div>Loading...</div>}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/form/:workflowId" element={<ProtectedRoute children={<FormBuilder />} />} />
            <Route path="/form/live/:workflowId/:nodeId" element={<LiveForm />} />
            <Route path="/workflows/:workflowId/edit/action/:nodeId" element={<ProtectedRoute children={<ActionEditor />}  />}/>
            <Route path="/:workflowId" element={<ProtectedRoute children={<WorkflowEditor />}  />}/>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Suspense>
  </SessionProvider>
);

export default App;
