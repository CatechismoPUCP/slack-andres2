import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainContent } from "@/components/MainContent";
import { Sidebar } from "@/components/Sidebar";
import type { Workspace as WorkspaceType } from "@/types/app";

export default function Workspace() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId) return;

      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();

      setWorkspace(data);
      setLoading(false);
    };

    loadWorkspace();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Workspace not found</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar workspaceId={workspaceId!} />
      <MainContent>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">
              Welcome to {workspace.name}
            </h1>
            <p className="text-muted-foreground">
              {workspace.members?.length || 0} {workspace.members?.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
      </MainContent>
    </>
  );
}
