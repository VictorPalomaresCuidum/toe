import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { usePlayerStore } from './playerStore';
import { TowerType } from '../types';

interface AuthStore {
  session: Session | null;
  user: User | null;
  loading: boolean;
  syncing: boolean;
  lastSynced: Date | null;
  error: string | null;

  // Actions
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  saveToCloud: () => Promise<string | null>;
  loadFromCloud: () => Promise<string | null>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  syncing: false,
  lastSynced: null,
  error: null,

  init: async () => {
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    });

    // Listen to auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signUp: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: error.message });
      return error.message;
    }
    return null;
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message });
      return error.message;
    }
    set({ session: data.session, user: data.user });
    // Load cloud data after login
    await get().loadFromCloud();
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, lastSynced: null });
  },

  saveToCloud: async () => {
    const { session } = get();
    if (!session) return 'No hay sesión activa.';

    set({ syncing: true, error: null });
    const { profile, unlockedTowers, towerLevels, completedLevels } =
      usePlayerStore.getState();

    const { error } = await supabase
      .from('player_saves')
      .upsert(
        {
          id: session.user.id,
          coins: profile.coins,
          level: profile.level,
          xp: profile.xp,
          profile_image: profile.profileImage,
          unlocked_towers: unlockedTowers,
          tower_levels: towerLevels,
          completed_levels: completedLevels,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    set({ syncing: false });
    if (error) {
      set({ error: error.message });
      return error.message;
    }
    set({ lastSynced: new Date() });
    return null;
  },

  loadFromCloud: async () => {
    const { session } = get();
    if (!session) return 'No hay sesión activa.';

    set({ syncing: true, error: null });
    const { data, error } = await supabase
      .from('player_saves')
      .select('*')
      .eq('id', session.user.id)
      .single();

    set({ syncing: false });
    if (error) {
      // PGRST116 = no rows → first login, no save yet
      if (error.code !== 'PGRST116') {
        set({ error: error.message });
        return error.message;
      }
      return null;
    }

    if (data) {
      usePlayerStore.setState({
        profile: {
          coins: data.coins,
          level: data.level,
          xp: data.xp,
          profileImage: data.profile_image ?? null,
        },
        unlockedTowers: (data.unlocked_towers ?? ['archer', 'cannon']) as TowerType[],
        towerLevels: data.tower_levels ?? {
          archer: 1, cannon: 1, mage: 1, ice: 1, lightning: 1,
        },
        completedLevels: data.completed_levels ?? [],
      });
    }
    set({ lastSynced: new Date() });
    return null;
  },
}));
