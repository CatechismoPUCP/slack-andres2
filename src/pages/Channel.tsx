import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Channel as ChannelType, User } from "@/types/app";
import { Sidebar } from "@/components/Sidebar";
import { InfoSection } from "@/components/InfoSection";
import { MainContent } from "@/components/MainContent";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { TextEditor } from "@/components/chat/TextEditor";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useChannelMessages } from "@/hooks/use-channel-messages";
import { VideoChat } from "@/components/VideoChat";
import { backfillChannelMemberships } from "@/actions/channels";
import { toast } from "@/hooks/use-toast";

export default function Channel() {
  const { workspaceId, channelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInCall = searchParams.get("call") === "true";
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [allChannels, setAllChannels] = useState<ChannelType[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const backfillRan = useRef<Record<string, boolean>>({});

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    updateMessage,
    deleteMessage,
    isSending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChannelMessages(channelId || "", workspaceId || "");

  const loadChannelData = async () => {
    console.log("📡 [Channel] loadChannelData START", { channelId, workspaceId });
    if (!channelId || !workspaceId) return;

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth";
        return;
      }

      // Get user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userData) {
        console.log("📡 [Channel] Current user loaded", { userId: userData.id });
        setCurrentUser(userData);
      }

      // Get channel data
      const { data: channelData } = await supabase
        .from("channels")
        .select("*")
        .eq("id", channelId)
        .single();

      if (channelData) {
        console.log("📡 [Channel] Current channel loaded", { channelId: channelData.id, name: channelData.name });
        setChannel(channelData);

        // Check if current user is a member of this channel
        if (userData && !channelData.members?.includes(userData.id)) {
          toast({
            title: "Limited access",
            description: "You're not a member of this channel yet. Contact a workspace admin to be added.",
            variant: "destructive",
          });
        }
      }

      // Fetch all workspace channels (that the user can see per RLS)
      const { data: channelsData } = await supabase
        .from("channels")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (channelsData) {
        console.log("📡 [Channel] All workspace channels loaded", { 
          count: channelsData.length, 
          channels: channelsData.map(c => ({ id: c.id, name: c.name }))
        });
        setAllChannels(channelsData);
      }

      // Fetch workspace members
      const { data: workspaceRow } = await supabase
        .from("workspaces")
        .select("members")
        .eq("id", workspaceId)
        .single();

      const memberIds: string[] = workspaceRow?.members || [];
      if (memberIds.length) {
        const { data: membersData } = await supabase
          .from("users")
          .select("*")
          .in("id", memberIds);

        if (membersData) {
          console.log("📡 [Channel] Workspace members loaded", { count: membersData.length });
          setMembers(membersData);
        }
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("❌ [Channel] Error loading channel data:", error);
    } finally {
      console.log("📡 [Channel] loadChannelData COMPLETE");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannelData();

    // Run backfill once per workspace (dev utility)
    if (workspaceId && !backfillRan.current[workspaceId]) {
      backfillRan.current[workspaceId] = true;
      backfillChannelMemberships(workspaceId).catch((err) => {
        console.error("❌ [Channel] Backfill failed:", err);
      });
    }
  }, [channelId, workspaceId]);

  // Real-time channel subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channelSubscription = supabase
      .channel('workspace-channels')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channels',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          console.log("🔴 [Channel] REALTIME: New channel inserted", payload.new);
          setAllChannels(prev => {
            const updated = [...prev, payload.new as ChannelType];
            console.log("🔴 [Channel] Updated channels state", { 
              previousCount: prev.length, 
              newCount: updated.length 
            });
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSubscription);
    };
  }, [workspaceId]);

  const handleSendMessage = (content: string, fileUrl?: string) => {
    sendMessage({ content, fileUrl: fileUrl || null });
  };

  if (loading || messagesLoading) {
    return <LoadingSpinner />;
  }

  if (!channel || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Channel not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar workspaceId={workspaceId!} />
      <InfoSection
        workspaceId={workspaceId!}
        channels={allChannels}
        members={members}
        currentUserId={currentUser.id}
      />
      <MainContent>
        <div className="flex flex-col h-screen">
          <ChatHeader
            channel={channel}
            memberCount={channel.members?.length || 0}
            workspaceId={workspaceId}
            currentUserId={currentUser.id}
            onMemberUpdate={loadChannelData}
          />
          {isInCall ? (
            <VideoChat
              roomName={`channel-${channelId}`}
              channelId={channelId}
              workspaceId={workspaceId!}
              onDisconnect={() => {
                searchParams.delete("call");
                setSearchParams(searchParams);
              }}
            />
          ) : (
            <>
              <MessageList
                messages={messages}
                currentUserId={currentUser.id}
                channelName={channel.name}
                channelCreatedAt={channel.created_at}
                channelOwnerId={channel.user_id}
                channelRegulators={channel.regulators || []}
                onUpdateMessage={(messageId, content) =>
                  updateMessage({ messageId, content })
                }
                onDeleteMessage={(messageId) => deleteMessage(messageId)}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
              <TextEditor
                onSend={handleSendMessage}
                isSending={isSending}
                channelName={channel.name}
              />
            </>
          )}
        </div>
      </MainContent>
    </div>
  );
}
