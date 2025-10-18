import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Hash, ChevronDown, Plus, User } from "lucide-react";
import { Channel, User as UserType } from "@/types/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useColorPreferences } from "@/providers/color-preferences";
import { CreateChannelDialog } from "./CreateChannelDialog";

interface InfoSectionProps {
  workspaceId: string;
  channels: Channel[];
  members: UserType[];
  currentUserId: string;
  onRefresh?: () => void;
}

export function InfoSection({ 
  workspaceId, 
  channels, 
  members, 
  currentUserId,
  onRefresh 
}: InfoSectionProps) {
  const { channelId } = useParams();
  const { color } = useColorPreferences();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const bgClass = color === 'green' 
    ? 'bg-[#0d2818]' 
    : color === 'blue' 
    ? 'bg-[#0a1829]' 
    : 'bg-background';

  const filteredMembers = members.filter(m => m.id !== currentUserId);

  return (
    <>
      <div 
        className={cn(
          "fixed left-[280px] lg:left-[420px] h-screen border-r border-border",
          "w-52 md:w-64 lg:w-[350px]",
          bgClass
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Channels Section */}
            <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-foreground/80">
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform",
                      channelsOpen ? "rotate-0" : "-rotate-90"
                    )} 
                  />
                  Channels
                </CollapsibleTrigger>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CollapsibleContent className="space-y-1 mt-2">
                {channels.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    No channels yet
                  </p>
                ) : (
                  channels.map((channel) => {
                    const isActive = channelId === channel.id;
                    return (
                      <Link
                        key={channel.id}
                        to={`/workspace/${workspaceId}/channel/${channel.id}`}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                          isActive 
                            ? "bg-accent text-accent-foreground font-medium" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Hash className="h-4 w-4" />
                        <span className="truncate">{channel.name}</span>
                      </Link>
                    );
                  })
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Direct Messages Section */}
            <Collapsible open={dmsOpen} onOpenChange={setDmsOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-foreground/80">
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    dmsOpen ? "rotate-0" : "-rotate-90"
                  )} 
                />
                Direct Messages
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {filteredMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    No other members
                  </p>
                ) : (
                  filteredMembers.map((member) => (
                    <Link
                      key={member.id}
                      to={`/workspace/${workspaceId}/dm/${member.id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.name?.[0] || member.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className={cn(
                            "absolute bottom-0 right-0 h-2 w-2 rounded-full border-2",
                            member.is_away ? "bg-muted-foreground" : "bg-green-500",
                            bgClass === 'bg-background' ? "border-background" : "border-[#0d2818]"
                          )}
                        />
                      </div>
                      <span className="truncate">{member.name || member.email}</span>
                    </Link>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </div>

      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={workspaceId}
        onSuccess={onRefresh}
      />
    </>
  );
}
