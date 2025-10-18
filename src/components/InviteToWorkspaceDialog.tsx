import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Search, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllPlatformUsers, inviteUserToWorkspace } from "@/actions/workspaces";
import { User } from "@/types/app";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InviteToWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  inviteCode: string;
  password?: string | null;
}

export function InviteToWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  inviteCode,
  password,
}: InviteToWorkspaceDialogProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const platformUsers = await getAllPlatformUsers();
      setUsers(platformUsers as User[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link with others to invite them",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    toast({
      title: "Code copied!",
      description: "Share this code with others to invite them",
    });
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleInviteUser = async (userId: string) => {
    setLoading(true);
    try {
      await inviteUserToWorkspace(workspaceId, userId);
      toast({
        title: "User invited!",
        description: "They now have access to this workspace",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {workspaceName}</DialogTitle>
          <DialogDescription>
            Share the invite link or select users to invite directly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite Code Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite Code</label>
            <div className="flex gap-2">
              <Input value={inviteCode} readOnly className="font-mono" />
              <Button size="icon" variant="outline" onClick={handleCopyCode}>
                {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Users can paste this code in "Join workspace with code"
            </p>
          </div>

          {/* Invite Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite Link</label>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly />
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {password && (
              <p className="text-sm text-muted-foreground">
                Password: <span className="font-mono">{password}</span>
              </p>
            )}
          </div>

          {/* Direct User Invitation */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite Users Directly</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[200px] border rounded-md p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleInviteUser(user.id)}
                        disabled={loading}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
