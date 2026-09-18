/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY_URL = 'tripsync_supabase_url';
const STORAGE_KEY_KEY = 'tripsync_supabase_anon_key';

export function getSavedConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  const isConfigured = Boolean(
    url && 
    anonKey && 
    url.startsWith('https://') && 
    !url.includes('your-project') &&
    anonKey !== 'your-anon-key'
  );

  return { url, anonKey, isConfigured };
}

export function saveConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
  supabaseInstance = null; // reset to force re-instantiation
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getSavedConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export async function testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await client.from('trips').select('id').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: unknown) {
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Unknown connection error' 
    };
  }
}
