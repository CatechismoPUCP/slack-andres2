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

export async function workspaceInvite(inviteCode: string, password?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Find workspace by invite code
  const { data: workspace, error: findError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();

  if (findError) throw new Error("Invalid invite code");

  // Check if password is required and valid
  if (workspace.password) {
    if (!password) throw new Error("Password required");
    const { data: isValid } = await supabase.rpc("verify_workspace_password", {
      workspace_id_param: workspace.id,
      password_param: password,
    });
    if (!isValid) throw new Error("Invalid password");
  }

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

export async function inviteUserToWorkspace(
  workspaceId: string,
  invitedUserId: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify current user is workspace member or admin
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (!workspace?.members?.includes(user.id) && workspace?.super_admin !== user.id) {
    throw new Error("You must be a workspace member to invite others");
  }

  // Check if user is already a member
  if (workspace.members?.includes(invitedUserId)) {
    throw new Error("User is already a member");
  }

  // Add user to workspace
  await supabase.rpc("add_member_to_workspace", {
    user_id: invitedUserId,
    workspace_id: workspaceId,
  });

  await supabase.rpc("add_workspace_to_user", {
    user_id: invitedUserId,
    new_workspace: workspaceId,
  });

  // Add user to all workspace channels
  const { data: workspaceChannels } = await supabase
    .from("channels")
    .select("id")
    .eq("workspace_id", workspaceId);

  if (workspaceChannels && workspaceChannels.length > 0) {
    for (const channel of workspaceChannels) {
      await supabase.rpc("update_channel_members", {
        new_member: invitedUserId,
        channel_id: channel.id,
      });
      
      await supabase.rpc("update_user_channels", {
        user_id: invitedUserId,
        channel_id: channel.id,
      });
    }
  }

  return true;
}

export async function getAllPlatformUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, avatar_url")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: {
    password?: string | null;
    name?: string;
    image_url?: string;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("workspaces")
    .update(settings)
    .eq("id", workspaceId)
    .eq("super_admin", user.id);

  if (error) throw error;
}
