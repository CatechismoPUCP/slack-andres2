import { useEffect, useRef } from "react";
import { MessageWithUser } from "@/types/app";
import { MessageItem } from "./MessageItem";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: MessageWithUser[];
  currentUserId: string;
  onUpdateMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  onUpdateMessage,
  onDeleteMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="py-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            onUpdate={onUpdateMessage}
            onDelete={onDeleteMessage}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
