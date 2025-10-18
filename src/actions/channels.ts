import { supabase } from "@/integrations/supabase/client";
import { Channel } from "@/types/app";

export async function createChannel(name: string, workspaceId: string, userId: string) {
  if (!name || name.length < 2) {
    throw new Error("Channel name must be at least 2 characters");
  }

  // Load current workspace members to make the new channel visible to everyone in the workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("members")
    .eq("id", workspaceId)
    .single();
  if (wsError) throw wsError;

  const initialMembers = Array.from(new Set([...(workspace?.members || []), userId]));

  // Insert new channel with all workspace members
  const { data: channel, error: insertError } = await supabase
    .from("channels")
    .insert({
      name: name.toLowerCase().trim(),
      workspace_id: workspaceId,
      user_id: userId,
      members: initialMembers,
      regulators: [userId],
    })
    .select()
    .single();

  if (insertError) throw insertError;

  // Add channel to each member's channels array
  if (initialMembers.length) {
    await Promise.all(
      initialMembers.map((memberId) =>
        supabase.rpc("update_user_channels", {
          user_id: memberId,
          channel_id: channel.id,
        })
      )
    );
  }

  // Add channel to workspace's channels array
  await supabase.rpc("add_channel_to_workspace", {
    channel_id: channel.id,
    workspace_id: workspaceId,
  });

  return channel as Channel;
}

export async function getUserWorkspaceChannels(workspaceId: string) {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Channel[];
}
