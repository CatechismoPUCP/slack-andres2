import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Workspace } from "@/types/app";

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
}

export function WorkspaceSwitcher({ currentWorkspaceId }: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("workspaces")
        .eq("id", user.id)
        .single();

      if (userData?.workspaces && userData.workspaces.length > 0) {
        const { data: workspaceData } = await supabase
          .from("workspaces")
          .select("*")
          .in("id", userData.workspaces);

        setWorkspaces(workspaceData || []);
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between hover:shadow-md transition-smooth"
        >
          <span className="truncate">
            {loading ? "Loading..." : currentWorkspace?.name || "Select Workspace"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          <p className="text-sm font-medium text-muted-foreground px-2 py-1.5">
            Your Workspaces
          </p>
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <Button
                key={workspace.id}
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={() => navigate(`/workspace/${workspace.id}`)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {workspace.image_url ? (
                    <img
                      src={workspace.image_url}
                      alt={workspace.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate flex-1 text-left">
                    {workspace.name}
                  </span>
                  {workspace.id === currentWorkspaceId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </Button>
            ))}
          </div>
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => navigate("/create-workspace")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Workspace
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
