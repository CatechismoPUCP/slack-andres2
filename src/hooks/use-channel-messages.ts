import { useState, useEffect } from "react";
import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageWithUser } from "@/types/app";
import { getMessages, sendMessage, updateMessage, deleteMessage } from "@/actions/messages";
import { toast } from "@/hooks/use-toast";

export function useChannelMessages(channelId: string, workspaceId: string) {
  const queryClient = useQueryClient();
  

  // Fetch messages with infinite scroll pagination
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages", channelId],
    queryFn: ({ pageParam = 0 }) => getMessages(channelId, pageParam, 50),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length;
    },
    enabled: !!channelId,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const initialMessages = data?.pages.flat() ?? [];

  // Realtime subscription
  useEffect(() => {
    if (!channelId) return;

    console.log('[realtime] subscribing to channel messages:', channelId);

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
          console.log('[realtime][messages][INSERT]', payload);
          const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("id", (payload.new as any).user_id)
            .maybeSingle();

          if (user) {
            const newMessage = { ...payload.new, user } as MessageWithUser;
            
            queryClient.setQueryData(
              ["messages", channelId],
              (oldData: any) => {
                if (!oldData) return { pages: [[newMessage]], pageParams: [0] };
                
                const newPages = [...oldData.pages];
                newPages[newPages.length - 1] = [...newPages[newPages.length - 1], newMessage];
                
                return {
                  ...oldData,
                  pages: newPages,
                };
              }
            );
          } else {
            console.log('[realtime][messages] User not found for INSERT:', (payload.new as any).user_id);
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
          console.log('[realtime][messages][UPDATE]', payload);
          const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("id", (payload.new as any).user_id)
            .maybeSingle();

          if (user) {
            const updatedMessage = { ...payload.new, user } as MessageWithUser;
            
            queryClient.setQueryData(
              ["messages", channelId],
              (oldData: any) => {
                if (!oldData) return oldData;
                
                const newPages = oldData.pages.map((page: MessageWithUser[]) =>
                  page.map((msg) =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                  )
                );
                
                return {
                  ...oldData,
                  pages: newPages,
                };
              }
            );
          } else {
            console.log('[realtime][messages] User not found for UPDATE:', (payload.new as any).user_id);
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
          console.log('[realtime][messages][DELETE]', payload);
          const deletedId = (payload.old as any).id;
          
          queryClient.setQueryData(
            ["messages", channelId],
            (oldData: any) => {
              if (!oldData) return oldData;
              
              const newPages = oldData.pages.map((page: MessageWithUser[]) =>
                page.filter((msg) => msg.id !== deletedId)
              );
              
              return {
                ...oldData,
                pages: newPages,
              };
            }
          );
        }
      )
      .subscribe((status) => {
        console.log('[realtime][messages][status]', status);
      });

    return () => {
      console.log('[realtime] unsubscribing from channel messages:', channelId);
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);

  // Mutations
  const sendMutation = useMutation({
    mutationFn: ({ content, fileUrl }: { content: string | null; fileUrl?: string | null }) =>
      sendMessage(channelId, workspaceId, content, fileUrl),
    onSuccess: async (data) => {
      // Optimistic UI: immediately add the message to cache
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.user.id)
          .maybeSingle();
        
        if (userData) {
          const newMessage = { ...data, user: userData } as MessageWithUser;
          queryClient.setQueryData(
            ["messages", channelId],
            (oldData: any) => {
              if (!oldData) return { pages: [[newMessage]], pageParams: [0] };
              
              const newPages = [...oldData.pages];
              const lastPage = [...newPages[newPages.length - 1]];
              
              // Only add if not already there (avoid duplicates from realtime)
              if (!lastPage.some(msg => msg.id === newMessage.id)) {
                lastPage.push(newMessage);
                newPages[newPages.length - 1] = lastPage;
              }
              
              return {
                ...oldData,
                pages: newPages,
              };
            }
          );
        }
      }
    },
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

  const messages = initialMessages;

  return {
    messages,
    isLoading,
    sendMessage: sendMutation.mutate,
    updateMessage: updateMutation.mutate,
    deleteMessage: deleteMutation.mutate,
    isSending: sendMutation.isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
