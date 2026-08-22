import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  
  signInWithGoogle: async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('[Sur Sansar] Supabase not configured — cannot sign in with Google')
      set({ isLoading: false })
      return
    }
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/community`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
      set({ isLoading: false });
    }
  },

  signInAsGuest: async () => {
    try {
      set({ isLoading: true });
      // MOCK: Fake a user session immediately for UI testing
      setTimeout(() => {
        set({ 
          user: { 
            id: 'mock-guest-' + Math.random().toString(36).substring(2, 9), 
            is_anonymous: true,
            user_metadata: { full_name: 'Mock Guest' }
          } as unknown as User, 
          isLoading: false 
        });
      }, 500);
    } catch (error) {
      console.error('Guest sign-in error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ user: null, isLoading: false })
      return
    }
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ isLoading: false });
    }
  },

  initAuth: () => {
    if (!isSupabaseConfigured || !supabase) {
      // No Supabase — start unauthenticated
      set({ isLoading: false })
      return
    }
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user || null, isLoading: false });
    });

    // Listen for auth changes — store subscription so it's only registered once
    // (calling initAuth multiple times in HMR would stack listeners otherwise)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null, isLoading: false });
    });

    // Store subscription for potential cleanup (e.g. in tests)
    _authSubscription = subscription
  },
}));

// Module-level subscription ref for cleanup
let _authSubscription: { unsubscribe: () => void } | null = null
export function cleanupAuthSubscription() {
  _authSubscription?.unsubscribe()
  _authSubscription = null
}
