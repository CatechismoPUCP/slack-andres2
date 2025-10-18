import { supabase } from "@/integrations/supabase/client";
import { Message, MessageWithUser, User } from "@/types/app";

export async function sendMessage(
  channelId: string,
  workspaceId: string,
  content: string | null,
  fileUrl?: string | null
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Verify user is channel member
  const { data: channel } = await supabase
    .from("channels")
    .select("members")
    .eq("id", channelId)
    .single();

  if (!channel?.members?.includes(user.id)) {
    throw new Error("User is not a member of this channel");
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      content,
      file_url: fileUrl,
      user_id: user.id,
      channel_id: channelId,
      workspace_id: workspaceId,
    })
    .select()
    .single();

  if (error) throw error;
  return message as Message;
}

export async function updateMessage(messageId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: message, error } = await supabase
    .from("messages")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return message as Message;
}

export async function deleteMessage(messageId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("messages")
    .update({
      is_deleted: true,
      content: null,
      file_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getMessages(
  channelId: string,
  page = 0,
  pageSize = 50
) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Step 1: Fetch messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw error;
  if (!messages || messages.length === 0) return [];

  // Step 2: Collect distinct user IDs
  const userIds = Array.from(new Set(messages.map(m => m.user_id)));

  // Step 3: Fetch users separately
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .in("id", userIds);

  if (usersError) throw usersError;

  // Step 4: Build user map and hydrate messages
  const userMap = (users || []).reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, User>);

  return messages.map(m => ({
    ...m,
    user: userMap[m.user_id] || {
      id: m.user_id,
      name: "Unknown User",
      email: "",
      avatar_url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      type: null,
      is_away: false,
      workspaces: null,
      channels: null,
      created_at: null,
      phone: null,
    }
  })) as MessageWithUser[];
}
