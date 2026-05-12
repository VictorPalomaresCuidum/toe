import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Replace these with your Supabase project URL and anon key ───────────────
// Go to: https://supabase.com → Your project → Settings → API
export const SUPABASE_URL = 'https://thrapdvzzkdmdznygboj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocmFwZHZ6emtkbWR6bnlnYm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODk5MTYsImV4cCI6MjA5NDE2NTkxNn0.KCZ9gKXVIJhBXe3nyqqvzrAnTBWC8yKIN6k-dxWu3ig';
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SecureStore adapter: persists the Supabase auth session on device.
 * Falls back to an in-memory store on web (SecureStore is native-only).
 */
const webStore: Record<string, string> = {};

const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return webStore[key] ?? null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      webStore[key] = value;
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      delete webStore[key];
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
