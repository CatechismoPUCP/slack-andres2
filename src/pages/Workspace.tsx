import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="h-24 w-24 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <MessageSquare className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          {workspace?.name}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your workspace is ready! Start by creating channels to organize conversations.
        </p>
        <Button
          onClick={() => navigate("/create-workspace")}
          className="bg-gradient-primary hover:shadow-glow transition-smooth"
        >
          Create Another Workspace
        </Button>
      </div>
    </div>
  );
}
