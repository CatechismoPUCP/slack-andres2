import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Copy, Check, Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import type { Workspace as WorkspaceType } from "@/types/app";

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyInviteLink = () => {
    if (!workspace) return;
    
    const inviteUrl = `${window.location.origin}/join/${workspace.invite_code}`;
    navigator.clipboard.writeText(inviteUrl);
    
    setCopied(true);
    toast({
      title: "Invite link copied!",
      description: "Share this link with your team members",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Workspace Switcher */}
        <div className="max-w-md">
          <WorkspaceSwitcher currentWorkspaceId={workspaceId} />
        </div>

        {/* Workspace Header */}
        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {workspace?.image_url ? (
                <img
                  src={workspace.image_url}
                  alt={workspace.name}
                  className="h-24 w-24 rounded-3xl object-cover shadow-glow"
                />
              ) : (
                <div className="h-24 w-24 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <MessageSquare className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {workspace?.name}
            </CardTitle>
            <CardDescription className="text-lg">
              Welcome to your workspace! Get started by inviting team members or creating channels.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="shadow-elegant hover:shadow-glow transition-smooth cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Invite Team Members</CardTitle>
                  <CardDescription>Share your workspace with others</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={copyInviteLink}
                className="w-full bg-gradient-primary hover:shadow-glow transition-smooth group"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Invite Link
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-glow transition-smooth cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
                  <Plus className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create Another Workspace</CardTitle>
                  <CardDescription>Set up a new team workspace</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/create-workspace")}
                variant="outline"
                className="w-full hover:shadow-md transition-smooth"
              >
                New Workspace
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="shadow-elegant border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Invite Code:</strong>{" "}
                <code className="px-2 py-1 bg-muted rounded text-foreground font-mono">
                  {workspace?.invite_code}
                </code>
              </p>
              <p className="text-xs text-muted-foreground">
                Members: {workspace?.members?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
