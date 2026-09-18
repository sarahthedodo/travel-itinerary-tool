/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

// ==============================================================================
// 1. 预设访问密码与 Supabase 硬编码凭据（按需求留出常量位置方便修改）
// ==============================================================================
/**
 * 预设访问密码：首次访问或退出后，需输入此密码解锁应用
 * 您可随时修改此处的密码字符串（例如 "mysecret2026"）
 */
export const PRESET_ACCESS_PASSWORD = 'mgm';

/**
 * 预设 Supabase Project URL
 * （优先读取 .env 中的 VITE_SUPABASE_URL，若无则使用下方常量）
 */
export const DEFAULT_SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://zoivmcdreieednxrxsip.supabase.co';

/**
 * 预设 Supabase Public Anon Key
 * （优先读取 .env 中的 VITE_SUPABASE_ANON_KEY，若无则使用下方常量）
 * 注意：Supabase anon key 属于由 RLS 安全策略保护的前端公开凭据
 */
export const DEFAULT_SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvaXZtY2RyZWllZWRueHJ4c2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTM0ODcsImV4cCI6MjEwNTMyOTQ4N30.R4qE071Qk0ix1T5QVtn30KdC5rxYZPHSbiifgc07OPQ';

const STORAGE_KEY_AUTH = 'tripsync_access_authorized';
const STORAGE_KEY_URL = 'tripsync_supabase_url';
const STORAGE_KEY_KEY = 'tripsync_supabase_anon_key';

/**
 * 检查当前浏览器是否已通过密码解锁授权
 */
export function isAccessAuthorized(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_AUTH) === 'true';
}

/**
 * 校验输入的密码并完成授权
 * @param inputPassword 用户输入的访问密码
 * @returns 密码是否匹配
 */
export function verifyAndAuthorizePassword(inputPassword: string): boolean {
  if (typeof window === 'undefined') return false;
  if (inputPassword.trim() === PRESET_ACCESS_PASSWORD) {
    localStorage.setItem(STORAGE_KEY_AUTH, 'true');
    return true;
  }
  return false;
}

/**
 * 清除授权状态 / 退出登录
 * 清空 localStorage 中的已授权状态并重置客户端实例
 */
export function revokeAccessAuthorization(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  }
  supabaseInstance = null;
}

export function getSavedConfig(): SupabaseConfig {
  const isAuthorized = isAccessAuthorized();
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  const url = storedUrl || DEFAULT_SUPABASE_URL;
  const anonKey = storedKey || DEFAULT_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    isAuthorized &&
    url && 
    anonKey && 
    url.startsWith('https://') && 
    !url.includes('your-project') &&
    anonKey !== 'your-anon-key' &&
    !anonKey.includes('your-anon-key-placeholder')
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

