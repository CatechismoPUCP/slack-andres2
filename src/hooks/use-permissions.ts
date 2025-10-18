import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'workspace_admin' | 'channel_regulator' | 'member';

interface PermissionCheck {
  workspaceId: string;
  channelId?: string;
  userId: string;
}

export function usePermissions({ workspaceId, channelId, userId }: PermissionCheck) {
  const [isWorkspaceAdmin, setIsWorkspaceAdmin] = useState(false);
  const [isChannelRegulator, setIsChannelRegulator] = useState(false);
  const [isChannelCreator, setIsChannelCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermissions() {
      try {
        // Check workspace admin role
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('workspace_id', workspaceId)
          .eq('role', 'workspace_admin')
          .maybeSingle();

        setIsWorkspaceAdmin(!!adminRole);

        // Check channel-specific permissions
        if (channelId) {
          const { data: channelData } = await supabase
            .from('channels')
            .select('user_id, regulators')
            .eq('id', channelId)
            .single();

          if (channelData) {
            setIsChannelCreator(channelData.user_id === userId);
            setIsChannelRegulator(
              channelData.regulators?.includes(userId) || false
            );
          }
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    checkPermissions();
  }, [workspaceId, channelId, userId]);

  return {
    isWorkspaceAdmin,
    isChannelRegulator,
    isChannelCreator,
    canAddMembers: isWorkspaceAdmin || isChannelCreator,
    canAssignRegulators: isWorkspaceAdmin || isChannelCreator,
    loading,
  };
}
