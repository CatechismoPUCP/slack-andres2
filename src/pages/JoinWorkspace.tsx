import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { workspaceInvite } from "@/actions/workspaces";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, AlertCircle } from "lucide-react";

export default function JoinWorkspace() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    const checkWorkspace = async () => {
      if (!inviteCode) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        sessionStorage.setItem('pendingInviteCode', inviteCode);
        navigate('/auth');
        return;
      }

      try {
        // Check if workspace requires password
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("name, password")
          .eq("invite_code", inviteCode)
          .single();

        if (workspace?.password) {
          setNeedsPassword(true);
          setWorkspaceName(workspace.name);
          setLoading(false);
        } else {
          await handleJoin();
        }
      } catch (err: any) {
        setError(err.message || "Failed to find workspace");
        setLoading(false);
      }
    };

    checkWorkspace();
  }, [inviteCode, navigate]);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const workspace = await workspaceInvite(inviteCode!, password || undefined);
      
      toast({
        title: "Success!",
        description: `You've joined ${workspace.name}`,
      });

      sessionStorage.removeItem('pendingInviteCode');
      navigate(`/workspace/${workspace.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join workspace");
      setLoading(false);
    }
  };

  if (loading && !needsPassword) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Unable to Join</CardTitle>
            <CardDescription className="text-base">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-primary hover:shadow-glow transition-smooth"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Join {workspaceName}</CardTitle>
            <CardDescription className="text-base">
              This workspace requires a password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter workspace password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <Button 
              onClick={handleJoin} 
              className="w-full bg-gradient-primary hover:shadow-glow transition-smooth" 
              disabled={loading}
            >
              {loading ? "Joining..." : "Join Workspace"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
