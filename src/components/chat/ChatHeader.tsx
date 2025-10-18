import { Hash, Users } from "lucide-react";
import { Channel } from "@/types/app";
import { useColorPreferences } from "@/providers/color-preferences";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  channel: Channel;
  memberCount: number;
}

export function ChatHeader({ channel, memberCount }: ChatHeaderProps) {
  const { color } = useColorPreferences();

  const bgClass =
    color === "green"
      ? "bg-[#0d2818] border-[#1a3d2b]"
      : color === "blue"
      ? "bg-[#0a1829] border-[#1a2f4a]"
      : "bg-background border-border";

  return (
    <div
      className={cn(
        "h-14 border-b flex items-center justify-between px-6",
        bgClass
      )}
    >
      <div className="flex items-center gap-2">
        <Hash className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{channel.name}</h2>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{memberCount} members</span>
      </div>
    </div>
  );
}
