import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { workspaceInvite } from "@/actions/workspaces";
import { z } from "zod";

interface JoinByCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const joinSchema = z.object({
  inviteCode: z.string().trim().min(6, "Code must be at least 6 characters").max(32, "Code too long"),
  password: z.string().max(128, "Password too long").optional(),
});

export function JoinByCodeDialog({ open, onOpenChange }: JoinByCodeDialogProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validated = joinSchema.parse({ 
        inviteCode: inviteCode.trim(), 
        password: password || undefined 
      });

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Store invite code and redirect to auth
        sessionStorage.setItem('pendingInviteCode', validated.inviteCode);
        toast({
          title: "Sign in required",
          description: "Please sign in to join the workspace",
        });
        navigate('/auth');
        return;
      }

      // Try to join workspace
      try {
        const workspace = await workspaceInvite(validated.inviteCode, validated.password);
        toast({
          title: "Success!",
          description: `Joined ${workspace.name}`,
        });
        onOpenChange(false);
        navigate(`/workspace/${workspace.id}`);
      } catch (error: any) {
        if (error.message?.includes('password') && !needsPassword) {
          setNeedsPassword(true);
          toast({
            title: "Password required",
            description: "This workspace requires a password",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0]?.message || "Invalid input",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error joining workspace",
          description: error.message || "Please check your invite code",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInviteCode("");
      setPassword("");
      setNeedsPassword(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Workspace</DialogTitle>
          <DialogDescription>
            Enter the workspace invite code to join
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              autoFocus
            />
          </div>

          {needsPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Workspace Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter workspace password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Joining..." : "Join Workspace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
