import { Home, MessageSquare, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PreferencesDialog } from './PreferencesDialog';

export function Sidebar({ workspaceId }: { workspaceId: string }) {
  const [user, setUser] = useState<any>(null);
  const [isAway, setIsAway] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (data) {
        setUser(data);
        setIsAway(data.is_away || false);
      }
    }
  };

  const handleToggleAway = async (checked: boolean) => {
    if (!user) return;
    setIsAway(checked);
    await supabase
      .from('users')
      .update({ is_away: checked })
      .eq('id', user.id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="h-screen w-[280px] lg:w-[420px] bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Workspace Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-sidebar-foreground">{user.name || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
            <MessageSquare className="h-4 w-4" />
            <span>DMs</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Channel list will go here */}
      </div>

      <Separator />

      {/* User Section */}
      <div className="p-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm truncate text-sidebar-foreground">{user.name || 'User'}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {isAway ? '🌙 Away' : '🟢 Active'}
                </p>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="away-mode" className="cursor-pointer">Set as away</Label>
                <Switch 
                  id="away-mode" 
                  checked={isAway} 
                  onCheckedChange={handleToggleAway}
                />
              </div>

              <Separator />

              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => setPreferencesOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span>Preferences</span>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <PreferencesDialog open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
}
