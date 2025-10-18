import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Briefcase } from "lucide-react";

export default function CreateWorkspace() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const inviteCode = Math.random().toString(36).substring(2, 15);

      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name,
          slug,
          invite_code: inviteCode,
          super_admin: user.id,
          members: [user.id],
          channels: [],
          regulators: [],
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add workspace to user
      await supabase.rpc("add_workspace_to_user", {
        user_id: user.id,
        new_workspace: workspace.id,
      });

      toast({
        title: "Workspace created!",
        description: `${name} is ready to use.`,
      });

      navigate(`/workspace/${workspace.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Create Your Workspace</CardTitle>
          <CardDescription className="text-base">
            Set up a workspace for your team to collaborate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="transition-smooth"
              />
              <p className="text-xs text-muted-foreground">
                This will be the name of your workspace
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow transition-smooth group"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Workspace"}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
