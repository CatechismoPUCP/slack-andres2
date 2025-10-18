import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Channel as ChannelType, User } from "@/types/app";
import { Sidebar } from "@/components/Sidebar";
import { InfoSection } from "@/components/InfoSection";
import { MainContent } from "@/components/MainContent";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useChannelMessages } from "@/hooks/use-channel-messages";

export default function Channel() {
  const { workspaceId, channelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();
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
  } = useChannelMessages(channelId || "", workspaceId || "");

  useEffect(() => {
    async function loadChannelData() {
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
    }

    loadChannelData();
  }, [channelId, workspaceId]);

  const handleSendMessage = (content: string) => {
    sendMessage({ content, fileUrl: null });
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
    <div className="flex h-screen overflow-hidden">
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
          />
          <MessageList
            messages={messages}
            currentUserId={currentUser.id}
            onUpdateMessage={(messageId, content) =>
              updateMessage({ messageId, content })
            }
            onDeleteMessage={(messageId) => deleteMessage(messageId)}
          />
          <MessageInput onSend={handleSendMessage} isSending={isSending} />
        </div>
      </MainContent>
    </div>
  );
}
