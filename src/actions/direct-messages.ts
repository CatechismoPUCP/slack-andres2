import { supabase } from "@/integrations/supabase/client";
import type { DirectMessage } from "@/types/app";

export async function sendDirectMessage(
  recipientId: string,
  content: string | null,
  fileUrl?: string | null
): Promise<DirectMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Ensure consistent ordering of user_one and user_two
  const userIds = [user.id, recipientId].sort();
  const [userOne, userTwo] = userIds;

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      user: user.id,
      user_one: userOne,
      user_two: userTwo,
      content,
      file_url: fileUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDirectMessages(
  userId: string,
  otherUserId: string,
  page = 0,
  pageSize = 50
): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Ensure consistent ordering
  const userIds = [userId, otherUserId].sort();
  const [userOne, userTwo] = userIds;

  const { data, error } = await supabase
    .from("direct_messages")
    .select("*, senderUser:users!direct_messages_user_fkey(*)")
    .or(`and(user_one.eq.${userOne},user_two.eq.${userTwo})`)
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return data || [];
}

export async function updateDirectMessage(
  messageId: number,
  content: string
): Promise<DirectMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("direct_messages")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDirectMessage(messageId: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("direct_messages")
    .update({
      is_deleted: true,
      content: null,
      file_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("user", user.id);

  if (error) throw error;
}
