import { MessageWithUser } from "@/types/app";
import { MessageItem } from "./MessageItem";
import { IntroBanner } from "./IntroBanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useChatScrollHandler } from "@/hooks/use-chat-scroll-handler";

interface MessageListProps {
  messages: MessageWithUser[];
  currentUserId: string;
  onUpdateMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  channelName: string;
  channelCreatedAt: string;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  onUpdateMessage,
  onDeleteMessage,
  channelName,
  channelCreatedAt,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: MessageListProps) {
  const { chatRef, bottomRef } = useChatScrollHandler({
    messages,
    hasNextPage,
  });

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-semibold">No messages yet</p>
          <p className="text-sm">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={chatRef}>
      <div className="py-4">
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage?.()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Previous Messages"
              )}
            </Button>
          </div>
        )}

        {!hasNextPage && (
          <IntroBanner
            type="channel"
            name={channelName}
            createdAt={channelCreatedAt}
          />
        )}

        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            onUpdate={onUpdateMessage}
            onDelete={onDeleteMessage}
          />
        ))}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
