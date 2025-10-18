import { supabase } from "@/integrations/supabase/client";
import { Workspace } from "@/types/app";

export async function getUserWorkspaceData(workspaceIds: string[]) {
  if (!workspaceIds || workspaceIds.length === 0) return [];

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .in("id", workspaceIds);

  if (error) throw error;
  return data as Workspace[];
}

export async function getCurrentWorkspaceData(workspaceId: string) {
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (workspaceError) throw workspaceError;

  // Get member details
  const members = workspace.members || [];
  const { data: memberData, error: memberError } = await supabase
    .from("users")
    .select("*")
    .in("id", members);

  if (memberError) throw memberError;

  return {
    workspace: workspace as Workspace,
    members: memberData,
  };
}

export async function workspaceInvite(inviteCode: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Find workspace by invite code
  const { data: workspace, error: findError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();

  if (findError) throw new Error("Invalid invite code");

  // Check if user is already a member
  if (workspace.members?.includes(user.id)) {
    return workspace;
  }

  // Add user to workspace members
  await supabase.rpc("add_member_to_workspace", {
    user_id: user.id,
    workspace_id: workspace.id,
  });

  // Add workspace to user's workspaces
  await supabase.rpc("add_workspace_to_user", {
    user_id: user.id,
    new_workspace: workspace.id,
  });

  // Get all channels in the workspace and add user to them
  const { data: workspaceChannels } = await supabase
    .from("channels")
    .select("id")
    .eq("workspace_id", workspace.id);

  // Add user to each channel's members array
  if (workspaceChannels && workspaceChannels.length > 0) {
    for (const channel of workspaceChannels) {
      await supabase.rpc("update_channel_members", {
        new_member: user.id,
        channel_id: channel.id,
      });
      
      await supabase.rpc("update_user_channels", {
        user_id: user.id,
        channel_id: channel.id,
      });
    }
  }

  return workspace;
}
