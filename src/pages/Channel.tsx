import { useEffect, useState } from "react";
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

export default function Channel() {
  const { workspaceId, channelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInCall = searchParams.get("call") === "true";
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        setCurrentUser(userData);
      }

      // Get channel data
      const { data: channelData } = await supabase
        .from("channels")
        .select("*")
        .eq("id", channelId)
        .single();

      if (channelData) {
        setChannel(channelData);
      }
    } catch (error) {
      console.error("Error loading channel data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannelData();
  }, [channelId, workspaceId]);

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
        channels={[channel]}
        members={[]}
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
