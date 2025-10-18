import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";
import { ColorPreferencesProvider } from "@/providers/color-preferences";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateWorkspace from "./pages/CreateWorkspace";
import JoinWorkspace from "./pages/JoinWorkspace";
import Workspace from "./pages/Workspace";
import Channel from "./pages/Channel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <ColorPreferencesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/create-workspace" element={<CreateWorkspace />} />
              <Route path="/join/:inviteCode" element={<JoinWorkspace />} />
              <Route path="/workspace/:workspaceId" element={<Workspace />} />
              <Route path="/workspace/:workspaceId/channel/:channelId" element={<Channel />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ColorPreferencesProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
