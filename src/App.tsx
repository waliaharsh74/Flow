import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TopBar from "./components/TopBar";

import FormBuilder from "./components/FormBuilder";
import { SessionProvider } from "./components/SessionProvider";
import { Suspense } from "react";


const App = () => (
   <SessionProvider>
    <Suspense fallback={<div>Loading...</div>}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/form" element={<FormBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </Suspense>
  </SessionProvider>
);

export default App;
