import { useState, useEffect } from 'react';
import { Search, UserPlus, Shield } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/app';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';

interface SearchBarProps {
  workspaceId: string;
  channelId: string;
  channelMembers: string[];
  channelRegulators: string[];
  currentUserId: string;
  onMemberAdded?: () => void;
}

export function SearchBar({
  workspaceId,
  channelId,
  channelMembers,
  channelRegulators,
  currentUserId,
  onMemberAdded,
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const { canAddMembers, canAssignRegulators } = usePermissions({
    workspaceId,
    channelId,
    userId: currentUserId,
  });

  useEffect(() => {
    if (open) {
      fetchWorkspaceMembers();
    }
  }, [open, workspaceId]);

  async function fetchWorkspaceMembers() {
    setLoading(true);
    try {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('members')
        .eq('id', workspaceId)
        .single();

      if (workspace?.members) {
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .in('id', workspace.members);

        if (users) {
          setWorkspaceMembers(users);
        }
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  async function addMemberToChannel(userId: string) {
    try {
      // Call the existing RPC function
      await supabase.rpc('update_channel_members', {
        new_member: userId,
        channel_id: channelId,
      });

      // Also update user's channels array
      await supabase.rpc('update_user_channels', {
        user_id: userId,
        channel_id: channelId,
      });

      toast.success('Member added to channel');
      onMemberAdded?.();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  }

  async function makeRegulator(userId: string) {
    try {
      // Update channel regulators array
      await supabase.rpc('update_channel_regulators', {
        regulator_id: userId,
        channel_id: channelId,
      });

      // Add regulator role to user_roles
      await supabase.from('user_roles').insert({
        user_id: userId,
        workspace_id: workspaceId,
        channel_id: channelId,
        role: 'channel_regulator',
      });

      toast.success('User promoted to regulator');
      onMemberAdded?.();
    } catch (error) {
      console.error('Error making regulator:', error);
      toast.error('Failed to assign regulator role');
    }
  }

  const filteredMembers = workspaceMembers.filter(
    (member) =>
      member.id !== currentUserId &&
      (member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Search members">
          <Search className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-96">
          <div className="p-2">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                Loading members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                No members found
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isMember = channelMembers.includes(member.id);
                const isRegulator = channelRegulators.includes(member.id);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.name?.[0] || member.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.name || member.email}
                        </span>
                        <div className="flex gap-1">
                          {isRegulator && (
                            <Badge variant="secondary" className="h-4 text-xs">
                              Regulator
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!isMember && canAddMembers && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addMemberToChannel(member.id)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                      {isMember && !isRegulator && canAssignRegulators && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => makeRegulator(member.id)}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Regulator
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
