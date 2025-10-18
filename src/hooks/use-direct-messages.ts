import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DirectMessageWithUser } from "@/types/app";
import { 
  getDirectMessages, 
  sendDirectMessage, 
  updateDirectMessage, 
  deleteDirectMessage 
} from "@/actions/direct-messages";
import { toast } from "@/hooks/use-toast";

export function useDirectMessages(currentUserId: string, otherUserId: string) {
  const queryClient = useQueryClient();
  
  // Ensure consistent ordering for query key
  const userIds = [currentUserId, otherUserId].sort();
  const [userOne, userTwo] = userIds;

  // Fetch messages with infinite scroll pagination
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["direct-messages", userOne, userTwo],
    queryFn: ({ pageParam = 0 }) => getDirectMessages(currentUserId, otherUserId, pageParam, 50),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length;
    },
    enabled: !!currentUserId && !!otherUserId,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const initialMessages = data?.pages.flat() ?? [];

  // Realtime subscription
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const channel = supabase
      .channel(`dm:${userOne}:${userTwo}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `and(user_one.eq.${userOne},user_two.eq.${userTwo})`,
        },
        async (payload) => {
          const senderId = (payload.new as any).user;
          const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("id", senderId)
            .single();

          if (user) {
            const newMessage = { ...payload.new, senderUser: user } as DirectMessageWithUser;
            
            queryClient.setQueryData(
              ["direct-messages", userOne, userTwo],
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
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `and(user_one.eq.${userOne},user_two.eq.${userTwo})`,
        },
        async (payload) => {
          const senderId = (payload.new as any).user;
          const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("id", senderId)
            .single();

          if (user) {
            const updatedMessage = { ...payload.new, senderUser: user } as DirectMessageWithUser;
            
            queryClient.setQueryData(
              ["direct-messages", userOne, userTwo],
              (oldData: any) => {
                if (!oldData) return oldData;
                
                const newPages = oldData.pages.map((page: DirectMessageWithUser[]) =>
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
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "direct_messages",
          filter: `and(user_one.eq.${userOne},user_two.eq.${userTwo})`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          
          queryClient.setQueryData(
            ["direct-messages", userOne, userTwo],
            (oldData: any) => {
              if (!oldData) return oldData;
              
              const newPages = oldData.pages.map((page: DirectMessageWithUser[]) =>
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, userOne, userTwo, queryClient]);

  // Mutations
  const sendMutation = useMutation({
    mutationFn: ({ content, fileUrl }: { content: string | null; fileUrl?: string | null }) =>
      sendDirectMessage(otherUserId, content, fileUrl),
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: number; content: string }) =>
      updateDirectMessage(messageId, content),
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update message",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => deleteDirectMessage(messageId),
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
