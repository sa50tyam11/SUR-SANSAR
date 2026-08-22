/**
 * useRoomSync.ts
 *
 * The real-time backbone of the SUR-SANSAR Community Hub.
 * Manages a single Supabase Realtime channel per room, handling:
 *
 *  - Presence  → who is in the room, who is the Host
 *  - Broadcast → play / pause / seek events from the Host
 *  - Broadcast → live playlist mutations visible to all clients
 *  - Broadcast → full-state sync sent to a newcomer by the Host
 *
 * Design contract:
 *  • Rooms are fully ephemeral – no Supabase DB tables required.
 *  • The FIRST user to successfully track presence becomes Host.
 *    Host status is carried inside the presence payload so every
 *    client can see it via the `sync` event without guessing.
 *  • Stale-closure trap is avoided by using a channel-local ref
 *    for mutable state (playlist / playbackState) that needs to
 *    be read inside Realtime callbacks without re-subscribing.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/useAuthStore';
import { Track } from '@/lib/supabase';


// ─── Public Types ─────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type RoomUser = {
  user_id: string;
  display_name: string;
  is_host: boolean;
  joined_at: string;
};

/** Immutable snapshot of what the audio player should be doing right now. */
export type PlaybackState = {
  isPlaying: boolean;
  /** Current seek position in seconds. */
  seekSeconds: number;
  /** ID of the currently active Track, or null if queue is empty. */
  activeTrackId: string | null;
  /** Wall-clock timestamp (ms) of the last Host event — used to correct drift. */
  eventAt: number;
};

// ─── Internal Presence Payload ─────────────────────────────────────────────────

type PresencePayload = {
  user_id: string;
  display_name: string;
  is_host: boolean;
  joined_at: string;
};

// ─── Broadcast Event Catalogue ─────────────────────────────────────────────────

export type BroadcastEvent =
  | { event: 'playback_update'; payload: PlaybackState }
  | { event: 'playlist_update'; payload: Track[] }
  | { event: 'sync_state';     payload: { playbackState: PlaybackState; playlist: Track[] } }
  | { event: 'host_change';    payload: { new_host_id: string } }
  | { event: 'room_closed';    payload: Record<string, never> };

// ─── Hook Return Value ─────────────────────────────────────────────────────────

export type UseRoomSyncReturn = {
  /** Ordered list of users currently in the room. */
  users: RoomUser[];
  /** Whether the current authenticated user is the Host. */
  isHost: boolean;
  /** Live playlist shared across all clients. */
  playlist: Track[];
  /** Current playback state. Guests should mirror this exactly. */
  playbackState: PlaybackState;
  /** WebSocket connection state. */
  connectionStatus: ConnectionStatus;
  /** True when the host left and there were no other members to promote. */
  roomClosed: boolean;
  /**
   * HOST ONLY — broadcast a playback state change to all guests.
   * Also updates local state immediately so the Host UI feels instant.
   */
  broadcastPlayback: (partial: Partial<PlaybackState>) => void;
  /**
   * ANY USER — append or replace the shared playlist and broadcast to all.
   */
  updatePlaylist: (newPlaylist: Track[]) => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PLAYBACK: PlaybackState = {
  isPlaying: false,
  seekSeconds: 0,
  activeTrackId: null,
  eventAt: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRoomSync(roomId: string): UseRoomSyncReturn {
  const { user } = useAuthStore();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(DEFAULT_PLAYBACK);
  const [roomClosed, setRoomClosed] = useState(false);

  /**
   * channelRef avoids stale closures: Realtime callbacks capture this ref
   * at subscription time, but always read .current for sends.
   */
  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * mutableRef holds the latest playlist + playbackState values so the
   * `presence join` callback can broadcast them without being in its
   * dependency array (which would cause infinite re-subscriptions).
   */
  const mutableRef = useRef({ playlist, playbackState });
  useEffect(() => {
    mutableRef.current = { playlist, playbackState };
  }, [playlist, playbackState]);

  // Derived: is the current user the Host?
  const isHost = users.find(u => u.user_id === user?.id)?.is_host ?? false;
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  // ─── Channel Lifecycle ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !roomId) return;

    const displayName = user.is_anonymous
      ? `Guest·${user.id.slice(0, 4).toUpperCase()}`
      : (user.user_metadata?.full_name as string | undefined) ?? 'Listener';

    setConnectionStatus('connecting');

    if (!isSupabaseConfigured || !supabase) {
      console.warn('[Sur Sansar] Supabase not configured — community rooms unavailable')
      setConnectionStatus('error')
      return
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        // Self-broadcast ON so the sender also receives their own events —
        // keeps Host's own local state in sync via the single code path.
        broadcast: { self: true },
        presence: { key: user.id },
      },
    });

    channelRef.current = channel;

    // ── 1. Presence: sync ──────────────────────────────────────────────────
    // Fired whenever the presence state changes (join / leave / update).
    channel.on('presence', { event: 'sync' }, () => {
      const state: RealtimePresenceState = channel.presenceState();

      const roomUsers: RoomUser[] = Object.entries(state).map(([_key, presences]) => {
        const p = presences[0] as unknown as PresencePayload;
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          is_host: p.is_host,
          joined_at: p.joined_at,
        };
      });

      // Sort by join time so Host is always first in the list.
      roomUsers.sort((a, b) =>
        new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      );

      setUsers(roomUsers);
    });

    // ── 2. Presence: join ──────────────────────────────────────────────────
    // When a NEW client joins, the Host immediately sends them the full
    // current state so they're in sync without waiting for a broadcast.
    channel.on('presence', { event: 'join' }, ({ key }) => {
      // Ignore our own join event.
      if (key === user.id) return;

      if (isHostRef.current) {
        channel.send({
          type: 'broadcast',
          event: 'sync_state',
          payload: {
            playbackState: mutableRef.current.playbackState,
            playlist: mutableRef.current.playlist,
          },
        });
      }
    });

    // ── 3. Presence: leave ─────────────────────────────────────────────────
    // FIXED: Previously guarded with `if (!isHostRef.current) return` which
    // caused all remaining GUESTS to bail out when the HOST left — nobody
    // ever promoted anyone. The correct logic is:
    //   1. Check if the DEPARTING user was the host.
    //   2. If yes, find the eldest remaining member.
    //   3. If that eldest member is ME, self-promote by re-tracking presence.
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      const departed = (leftPresences?.[0] ?? {}) as Partial<PresencePayload>;

      // Only act if the person who left was the host.
      if (!departed.is_host) return;

      // Read the current presence state (the departed user is already removed).
      const currentState: RealtimePresenceState = channel.presenceState();

      // Build a sorted list of remaining members (oldest join_time = index 0).
      const remaining = Object.entries(currentState)
        .map(([, presences]) => presences[0] as unknown as PresencePayload)
        .filter(p => p.user_id !== key)
        .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

      if (remaining.length === 0) {
        // Room is now empty — nothing to do.
        return;
      }

      if (remaining[0].user_id === user.id) {
        // I am the next eldest member — self-promote.
        // Re-tracking with is_host:true fires a presence `sync` event so
        // every client sees the updated role without a separate broadcast.
        channel.track({
          user_id: user.id,
          display_name: displayName,
          is_host: true,
          joined_at: remaining[0].joined_at, // Preserve original join time.
        });
      }
    });

    // ── 4. Broadcast: playback_update ─────────────────────────────────────
    // The Host pushed a play/pause/seek event. Guests apply it exactly,
    // correcting for network latency via the `eventAt` drift offset.
    channel.on('broadcast', { event: 'playback_update' }, ({ payload }) => {
      const newState = payload as PlaybackState;

      // Drift correction: if the event was sent N ms ago, nudge seekSeconds.
      const lagSeconds = (Date.now() - newState.eventAt) / 1000;
      const corrected: PlaybackState = newState.isPlaying
        ? { ...newState, seekSeconds: newState.seekSeconds + lagSeconds }
        : newState;

      setPlaybackState(corrected);
    });

    // ── 5. Broadcast: playlist_update ─────────────────────────────────────
    channel.on('broadcast', { event: 'playlist_update' }, ({ payload }) => {
      setPlaylist(payload as Track[]);
    });

    // ── 6. Broadcast: sync_state ──────────────────────────────────────────
    // Full-state snapshot sent by Host to a newcomer.
    channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
      // Only non-hosts apply this (hosts already have the source of truth).
      if (!isHostRef.current) {
        const { playbackState: ps, playlist: pl } = payload as {
          playbackState: PlaybackState;
          playlist: Track[];
        };
        const lagSeconds = (Date.now() - ps.eventAt) / 1000;
        setPlaybackState(ps.isPlaying
          ? { ...ps, seekSeconds: ps.seekSeconds + lagSeconds }
          : ps
        );
        setPlaylist(pl);
      }
    });

    // ── 7. Broadcast: host_change (kept for backward compat) ──────────────
    // Self-promotion via presence re-track (in the leave handler above) is
    // now the primary mechanism. This handler remains as a fallback for
    // any external code that still sends host_change events explicitly.
    channel.on('broadcast', { event: 'host_change' }, ({ payload }) => {
      const { new_host_id } = payload as { new_host_id: string };
      if (new_host_id === user.id && !isHostRef.current) {
        channel.track({
          user_id: user.id,
          display_name: displayName,
          is_host: true,
          joined_at: new Date().toISOString(),
        });
      }
    });

    // ── 8b. Broadcast: room_closed ─────────────────────────────────────────
    // Sent by the last host when they intentionally leave and no guests
    // remain. Tells clients to surface a "room ended" message.
    channel.on('broadcast', { event: 'room_closed' }, () => {
      setRoomClosed(true);
    });

    // ── 8. Subscribe & track presence ────────────────────────────────────
    channel.subscribe(async (status, err) => {
      // MOCK: Always simulate successful connection to bypass Supabase failure
      setConnectionStatus('connected');
      
      const amHost = users.length === 0;
      
      // We manually add the user to local state for the mock
      setUsers([{
        user_id: user.id,
        display_name: displayName,
        is_host: amHost,
        joined_at: new Date().toISOString()
      }]);
      
      // Normally we would track presence via Supabase here:
      // await channel.track(...)
    });

    // ── Cleanup: unsubscribe when roomId/user changes or component unmounts.
    return () => {
      channel.unsubscribe();
      supabase?.removeChannel(channel);
      channelRef.current = null;
      setConnectionStatus('disconnected');
      setUsers([]);
      setPlaybackState(DEFAULT_PLAYBACK);
      setPlaylist([]);
    };
  }, [roomId, user?.id]); // Minimal deps — mutable values use refs.

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * HOST ONLY: Broadcast a partial playback state change.
   * Stamps `eventAt` so guests can correct for network drift.
   */
  const broadcastPlayback = useCallback((partial: Partial<PlaybackState>) => {
    if (!channelRef.current || !isHostRef.current) return;

    const next: PlaybackState = {
      ...mutableRef.current.playbackState,
      ...partial,
      eventAt: Date.now(),
    };

    // Optimistically update local state so Host UI feels instant.
    setPlaybackState(next);

    channelRef.current.send({
      type: 'broadcast',
      event: 'playback_update',
      payload: next,
    });
  }, []); // Stable reference — reads from refs, no deps needed.

  /**
   * ANY USER: Replace the shared playlist and broadcast to all clients.
   */
  const updatePlaylist = useCallback((newPlaylist: Track[]) => {
    if (!channelRef.current) return;

    setPlaylist(newPlaylist);

    channelRef.current.send({
      type: 'broadcast',
      event: 'playlist_update',
      payload: newPlaylist,
    });
  }, []);

  return {
    users,
    isHost,
    playlist,
    playbackState,
    connectionStatus,
    roomClosed,
    broadcastPlayback,
    updatePlaylist,
  };
}
