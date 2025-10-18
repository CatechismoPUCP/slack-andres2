import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainContent } from "@/components/MainContent";
import { Sidebar } from "@/components/Sidebar";
import { InfoSection } from "@/components/InfoSection";
import { NoDataScreen } from "@/components/NoDataScreen";
import { getUserWorkspaceChannels } from "@/actions/channels";
import { getCurrentWorkspaceData } from "@/actions/workspaces";
import type { Workspace as WorkspaceType, Channel, User } from "@/types/app";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workspace() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadWorkspaceData = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);

      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get workspace and members
      const { workspace: workspaceData, members: memberData } = await getCurrentWorkspaceData(workspaceId);
      
      // Get channels
      const channelData = await getUserWorkspaceChannels(workspaceId);

      // Get current user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setWorkspace(workspaceData);
      setMembers(memberData);
      setChannels(channelData);
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  if (loading) {
    return (
      <>
        <Sidebar workspaceId={workspaceId!} />
        <div className="fixed left-[280px] lg:left-[420px] w-52 md:w-64 lg:w-[350px] h-screen border-r border-border bg-background p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </div>
        <MainContent>
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Loading workspace...</p>
          </div>
        </MainContent>
      </>
    );
  }

  if (!workspace || !currentUser) {
    return (
      <>
        <Sidebar workspaceId={workspaceId!} />
        <MainContent>
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Workspace not found</p>
          </div>
        </MainContent>
      </>
    );
  }

  return (
    <>
      <Sidebar workspaceId={workspaceId!} />
      <InfoSection
        workspaceId={workspaceId!}
        channels={channels}
        members={members}
        currentUserId={currentUser.id}
        onRefresh={loadWorkspaceData}
      />
      <MainContent>
        {channels.length === 0 ? (
          <NoDataScreen
            workspaceName={workspace.name}
            onCreateChannel={() => setCreateDialogOpen(true)}
          />
        ) : (
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
        )}
      </MainContent>
    </>
  );
}
