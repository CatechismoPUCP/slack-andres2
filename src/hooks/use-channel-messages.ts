import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageWithUser } from "@/types/app";
import { getMessages, sendMessage, updateMessage, deleteMessage } from "@/actions/messages";
import { toast } from "@/hooks/use-toast";

export function useChannelMessages(channelId: string, workspaceId: string) {
  const queryClient = useQueryClient();
  const [optimisticMessages, setOptimisticMessages] = useState<MessageWithUser[]>([]);

  // Initial fetch
  const { data: initialMessages = [], isLoading } = useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => getMessages(channelId),
    enabled: !!channelId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`channel:${channelId}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch user data for the new message
          const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("id", (payload.new as any).user_id)
            .single();

          if (user) {
            const newMessage = { ...payload.new, user } as MessageWithUser;
            queryClient.setQueryData<MessageWithUser[]>(
              ["messages", channelId],
              (old = []) => [...old, newMessage]
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("id", (payload.new as any).user_id)
            .single();

          if (user) {
            const updatedMessage = { ...payload.new, user } as MessageWithUser;
            queryClient.setQueryData<MessageWithUser[]>(
              ["messages", channelId],
              (old = []) =>
                old.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          queryClient.setQueryData<MessageWithUser[]>(
            ["messages", channelId],
            (old = []) => old.filter((msg) => msg.id !== (payload.old as any).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);

  // Mutations
  const sendMutation = useMutation({
    mutationFn: ({ content, fileUrl }: { content: string | null; fileUrl?: string | null }) =>
      sendMessage(channelId, workspaceId, content, fileUrl),
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      updateMessage(messageId, content),
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update message",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const messages = [...initialMessages, ...optimisticMessages];

  return {
    messages,
    isLoading,
    sendMessage: sendMutation.mutate,
    updateMessage: updateMutation.mutate,
    deleteMessage: deleteMutation.mutate,
    isSending: sendMutation.isPending,
  };
}
