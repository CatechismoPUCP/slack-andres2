import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { InfoSection } from "@/components/InfoSection";
import { MainContent } from "@/components/MainContent";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { TextEditor } from "@/components/chat/TextEditor";
import { useDirectMessages } from "@/hooks/use-direct-messages";
import { User, Workspace, Channel } from "@/types/app";
import { Loader2 } from "lucide-react";

export default function DirectMessage() {
  const { workspaceId, recipientId } = useParams<{ workspaceId: string; recipientId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recipientUser, setRecipientUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  } = useDirectMessages(currentUser?.id || "", recipientId || "");

  useEffect(() => {
    const fetchData = async () => {
      if (!workspaceId || !recipientId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Fetch current user
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!userData) {
          navigate("/auth");
          return;
        }

        setCurrentUser(userData);

        // Fetch recipient user
        const { data: recipientData } = await supabase
          .from("users")
          .select("*")
          .eq("id", recipientId)
          .single();

        if (!recipientData) {
          navigate(`/workspace/${workspaceId}`);
          return;
        }

        setRecipientUser(recipientData);

        // Fetch workspace
        const { data: workspaceData } = await supabase
          .from("workspaces")
          .select("*")
          .eq("id", workspaceId)
          .single();

        if (!workspaceData) {
          navigate("/");
          return;
        }

        setWorkspace(workspaceData);

        // Fetch channels
        if (workspaceData.channels) {
          const { data: channelsData } = await supabase
            .from("channels")
            .select("*")
            .in("id", workspaceData.channels)
            .order("created_at", { ascending: true });

          if (channelsData) {
            setChannels(channelsData);
          }
        }

        // Fetch members
        if (workspaceData.members) {
          const { data: membersData } = await supabase
            .from("users")
            .select("*")
            .in("id", workspaceData.members);

          if (membersData) {
            setMembers(membersData);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, recipientId, navigate]);

  const handleSendMessage = (content: string | null, fileUrl?: string | null) => {
    if (!content && !fileUrl) return;
    sendMessage({ content, fileUrl });
  };

  const handleUpdateMessage = (messageId: string, content: string) => {
    updateMessage({ messageId: parseInt(messageId), content });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(parseInt(messageId));
  };

  if (isLoading || !currentUser || !recipientUser || !workspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Transform DirectMessageWithUser to MessageWithUser format for MessageList
  const transformedMessages = messages.map((msg) => ({
    id: msg.id.toString(),
    content: msg.content,
    file_url: msg.file_url,
    user_id: msg.user,
    channel_id: "", // Not applicable for DMs
    workspace_id: workspaceId || "",
    is_deleted: msg.is_deleted,
    created_at: msg.created_at,
    updated_at: msg.updated_at,
    user: msg.senderUser,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        workspaceId={workspaceId || ""}
      />
      
      <InfoSection
        workspaceId={workspaceId || ""}
        channels={channels}
        members={members}
        currentUserId={currentUser.id}
      />

      <MainContent>
        <ChatHeader 
          recipientUser={recipientUser}
          isDM={true}
        />
        
        <MessageList
          messages={transformedMessages}
          currentUserId={currentUser.id}
          onUpdateMessage={handleUpdateMessage}
          onDeleteMessage={handleDeleteMessage}
          channelName={recipientUser.name || recipientUser.email}
          channelCreatedAt={recipientUser.created_at || new Date().toISOString()}
          channelOwnerId=""
          isDM={true}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />

        <TextEditor
          onSend={handleSendMessage}
          isSending={isSending}
          channelName={recipientUser.name || recipientUser.email}
        />
      </MainContent>
    </div>
  );
}
