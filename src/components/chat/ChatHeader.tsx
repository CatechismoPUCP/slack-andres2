import { Hash, Users, Headphones } from "lucide-react";
import { Channel } from "@/types/app";
import { useColorPreferences } from "@/providers/color-preferences";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";

interface ChatHeaderProps {
  channel: Channel;
  memberCount: number;
}

export function ChatHeader({ channel, memberCount }: ChatHeaderProps) {
  const { color } = useColorPreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInCall = searchParams.get("call") === "true";

  const toggleCall = () => {
    if (isInCall) {
      searchParams.delete("call");
    } else {
      searchParams.set("call", "true");
    }
    setSearchParams(searchParams);
  };

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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{memberCount} members</span>
        </div>
        <Button
          variant={isInCall ? "default" : "outline"}
          size="icon"
          onClick={toggleCall}
          title={isInCall ? "Leave call" : "Start call"}
        >
          <Headphones className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
