import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/useAuthStore';
import { Track } from '@/lib/supabase';

export type RoomUser = {
  user_id: string;
  name: string;
  is_host: boolean;
};

export type PlaybackState = {
  isPlaying: boolean;
  timestamp: number;
  trackId: string | null;
};

export function useRoom(roomId: string) {
  const { user } = useAuthStore();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    timestamp: 0,
    trackId: null,
  });

  const isHost = users.find(u => u.user_id === user?.id)?.is_host || false;

  useEffect(() => {
    if (!user || !roomId) return;
    if (!supabase) return; // Supabase not configured

    // Initialize the channel
    const roomChannel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // 1. Handle Presence (Users joining/leaving)
    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = roomChannel.presenceState();
        const roomUsers: RoomUser[] = [];
        
        // Extract users and assign host (first person to join usually becomes host if we sort by join time, 
        // but for simplicity, we can make the first person in the list the host if no host exists)
        Object.keys(newState).forEach((key, index) => {
          const presenceData = newState[key][0] as any;
          roomUsers.push({
            user_id: key,
            name: presenceData.name || 'Guest',
            is_host: presenceData.is_host || index === 0, // First user is host if not explicitly set
          });
        });
        
        setUsers(roomUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined', key, newPresences);
        // If I am the host, and someone joins, I should broadcast the current playlist and playback state to them
        if (isHost) {
           roomChannel.send({
             type: 'broadcast',
             event: 'sync_state',
             payload: { playlist, playbackState },
           });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left', key, leftPresences);
      });

    // 2. Handle Broadcasts (Playback events and playlist changes)
    roomChannel
      .on('broadcast', { event: 'playback_update' }, ({ payload }) => {
        console.log('Received playback update', payload);
        if (!isHost) {
          setPlaybackState(payload);
        }
      })
      .on('broadcast', { event: 'playlist_update' }, ({ payload }) => {
        console.log('Received playlist update', payload);
        setPlaylist(payload);
      })
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
         // When joining, receive the current state from the host
         if (!isHost) {
            setPlaylist(payload.playlist);
            setPlaybackState(payload.playbackState);
         }
      });

    // Subscribe to the channel
    roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const userName = user.is_anonymous ? `Guest_${user.id.substring(0, 4)}` : user.user_metadata?.full_name;
        // Track presence
        await roomChannel.track({
          user_id: user.id,
          name: userName,
          joined_at: new Date().toISOString(),
        });
      }
    });

    setChannel(roomChannel);

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, user]); // Note: isHost, playlist, playbackState are omitted intentionally to avoid re-subscribing

  // Helper functions to send events
  const broadcastPlayback = useCallback((state: PlaybackState) => {
    if (!channel || !isHost) return;
    setPlaybackState(state); // Update local state immediately
    channel.send({
      type: 'broadcast',
      event: 'playback_update',
      payload: state,
    });
  }, [channel, isHost]);

  const updatePlaylist = useCallback((newPlaylist: Track[]) => {
    if (!channel) return;
    setPlaylist(newPlaylist); // Update local state
    channel.send({
      type: 'broadcast',
      event: 'playlist_update',
      payload: newPlaylist,
    });
  }, [channel]);

  return {
    users,
    isHost,
    playlist,
    playbackState,
    broadcastPlayback,
    updatePlaylist,
  };
}
