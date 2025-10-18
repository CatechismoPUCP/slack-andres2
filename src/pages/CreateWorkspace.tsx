import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Briefcase } from "lucide-react";
import { useWorkspaceValues } from "@/hooks/create-workspace-values";
import { ImageUpload } from "@/components/ImageUpload";
import { generateSlug, generateInviteCode } from "@/lib/workspace-utils";

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { name, imageUrl, currStep, updateValues, setCurrStep, reset } = useWorkspaceValues();

  useEffect(() => {
    // Reset store on mount
    return () => reset();
  }, [reset]);

  const handleNext = () => {
    if (currStep === 1 && name.length < 2) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Workspace name must be at least 2 characters",
      });
      return;
    }
    setCurrStep(2);
  };

  const handleBack = () => {
    setCurrStep(1);
  };

  const handleCreate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = generateSlug(name);
      const inviteCode = generateInviteCode();

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
          image_url: imageUrl || null,
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

      reset();
      navigate(`/workspace/${workspace.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
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
          <CardTitle className="text-3xl font-bold">
            Create Your Workspace
          </CardTitle>
          <CardDescription className="text-base">
            Step {currStep} of 2: {currStep === 1 ? "Name your workspace" : "Add an image (optional)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currStep === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  value={name}
                  onChange={(e) => updateValues({ name: e.target.value })}
                  minLength={2}
                  className="transition-smooth"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Choose a name that represents your team or organization
                </p>
              </div>
              <Button
                onClick={handleNext}
                className="w-full bg-gradient-primary hover:shadow-glow transition-smooth group"
                disabled={name.length < 2}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace Image</Label>
                <ImageUpload />
                <p className="text-xs text-muted-foreground">
                  Add an image to personalize your workspace (you can skip this step)
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 group"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-smooth" />
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth group"
                >
                  Create Workspace
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
