import { useEffect, useRef, MutableRefObject } from "react";

interface UseChatScrollHandlerProps {
  messages: any[];
  hasNextPage?: boolean;
}

interface UseChatScrollHandlerReturn {
  chatRef: MutableRefObject<HTMLDivElement | null>;
  bottomRef: MutableRefObject<HTMLDivElement | null>;
}

export function useChatScrollHandler({
  messages,
  hasNextPage,
}: UseChatScrollHandlerProps): UseChatScrollHandlerReturn {
  const chatRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const previousScrollHeight = useRef<number>(0);

  // Auto-scroll to bottom on new messages (only if user is near bottom)
  useEffect(() => {
    const chatContainer = chatRef.current;
    if (!chatContainer) return;

    const isNearBottom =
      chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;

    if (isNearBottom && !hasNextPage) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, hasNextPage]);

  // Preserve scroll position when loading more messages
  useEffect(() => {
    const chatContainer = chatRef.current;
    if (!chatContainer) return;

    if (previousScrollHeight.current > 0) {
      const newScrollHeight = chatContainer.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      chatContainer.scrollTop += scrollDiff;
    }

    previousScrollHeight.current = chatContainer.scrollHeight;
  }, [messages.length]);

  return { chatRef, bottomRef };
}
