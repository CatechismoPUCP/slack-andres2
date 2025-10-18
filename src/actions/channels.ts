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

export async function backfillChannelMemberships(workspaceId: string) {
  console.log("🔧 [backfillChannelMemberships] Starting for workspace:", workspaceId);

  // 1) Fetch workspace members
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("members")
    .eq("id", workspaceId)
    .single();

  if (wsError) {
    console.error("❌ [backfillChannelMemberships] Error fetching workspace:", wsError);
    throw wsError;
  }

  const workspaceMembers = workspace?.members || [];
  console.log("🔧 [backfillChannelMemberships] Workspace members:", workspaceMembers);

  // 2) Fetch all channels in workspace
  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (channelsError) {
    console.error("❌ [backfillChannelMemberships] Error fetching channels:", channelsError);
    throw channelsError;
  }

  if (!channels || channels.length === 0) {
    console.log("🔧 [backfillChannelMemberships] No channels to backfill");
    return;
  }

  console.log("🔧 [backfillChannelMemberships] Processing", channels.length, "channels");

  // 3) For each channel, update members if needed
  for (const channel of channels) {
    const existingMembers = channel.members || [];
    const allMembers = Array.from(new Set([...existingMembers, ...workspaceMembers]));

    // Check if there are new members to add
    const newMembers = allMembers.filter(m => !existingMembers.includes(m));

    if (newMembers.length > 0) {
      console.log(`🔧 [backfillChannelMemberships] Channel "${channel.name}" - Adding ${newMembers.length} new members`);

      // 4) Update channel.members
      const { error: updateError } = await supabase
        .from("channels")
        .update({ members: allMembers })
        .eq("id", channel.id);

      if (updateError) {
        console.error(`❌ [backfillChannelMemberships] Error updating channel ${channel.id}:`, updateError);
        continue;
      }

      // 5) Update users.channels for each new member
      await Promise.all(
        newMembers.map((memberId) =>
          supabase.rpc("update_user_channels", {
            user_id: memberId,
            channel_id: channel.id,
          })
        )
      );

      console.log(`✅ [backfillChannelMemberships] Channel "${channel.name}" updated successfully`);
    } else {
      console.log(`✅ [backfillChannelMemberships] Channel "${channel.name}" already up to date`);
    }
  }

  console.log("🔧 [backfillChannelMemberships] Complete");
}
