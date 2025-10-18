import { useEffect, useState } from 'react';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer 
} from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from './ui/loading-spinner';
import { toast } from 'sonner';

interface VideoChatProps {
  roomName: string;
  channelId?: string;
  workspaceId: string;
  onDisconnect?: () => void;
}

export function VideoChat({ 
  roomName, 
  channelId, 
  workspaceId,
  onDisconnect 
}: VideoChatProps) {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        console.log('Fetching LiveKit token for room:', roomName);
        
        const { data, error } = await supabase.functions.invoke('livekit-token', {
          body: { 
            roomName, 
            channelId,
            workspaceId 
          }
        });

        if (error) throw error;
        if (!data?.token) throw new Error('No token returned');

        console.log('LiveKit token received successfully');
        setToken(data.token);
      } catch (err) {
        console.error('Error fetching LiveKit token:', err);
        setError(err instanceof Error ? err.message : 'Failed to join call');
        toast.error('Failed to join video call');
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [roomName, channelId, workspaceId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Call Error</p>
          <p className="text-sm text-muted-foreground">{error || 'Unable to join call'}</p>
        </div>
      </div>
    );
  }

  // Get LiveKit URL from environment
  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

  if (!livekitUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-destructive">LiveKit not configured. Please set VITE_LIVEKIT_URL environment variable.</p>
      </div>
    );
  }

  console.log('Connecting to LiveKit room:', roomName);

  return (
    <div className="flex-1 overflow-hidden">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        onDisconnected={onDisconnect}
        className="h-full"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
