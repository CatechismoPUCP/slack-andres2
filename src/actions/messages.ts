import { supabase } from "@/integrations/supabase/client";
import { Message, MessageWithUser } from "@/types/app";

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

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      *,
      user:users(*)
    `)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw error;
  return messages as MessageWithUser[];
}
