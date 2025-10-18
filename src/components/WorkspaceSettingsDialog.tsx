import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateWorkspaceSettings } from "@/actions/workspaces";
import { Lock, Unlock } from "lucide-react";

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  currentPassword?: string | null;
  onUpdate: () => void;
}

export function WorkspaceSettingsDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  currentPassword,
  onUpdate,
}: WorkspaceSettingsDialogProps) {
  const [password, setPassword] = useState(currentPassword || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateWorkspaceSettings(workspaceId, {
        password: password || null,
      });
      toast({
        title: "Settings updated!",
        description: "Workspace password has been updated",
      });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    setLoading(true);
    try {
      await updateWorkspaceSettings(workspaceId, {
        password: null,
      });
      setPassword("");
      toast({
        title: "Password removed!",
        description: "Workspace is now accessible without a password",
      });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Manage access settings for {workspaceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Workspace Password (Optional)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                {currentPassword && !password && (
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="password"
                  type="text"
                  placeholder="Set a password to protect this workspace"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={currentPassword && !password ? "pl-9" : ""}
                />
              </div>
              {currentPassword && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleRemovePassword}
                  disabled={loading}
                  title="Remove password"
                >
                  <Unlock className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Users will need this password to join via invite link
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
