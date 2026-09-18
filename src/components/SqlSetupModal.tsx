/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Key, 
  Sparkles,
  RotateCcw,
  LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  DEFAULT_SUPABASE_URL, 
  DEFAULT_SUPABASE_ANON_KEY,
  revokeAccessAuthorization
} from '../lib/supabase';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- TripSync Database Schema (Supabase PostgreSQL + Realtime)
-- Run this in your Supabase SQL Editor to enable cross-device live collaboration
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    color TEXT DEFAULT '#3B82F6',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    destination TEXT DEFAULT '',
    currency TEXT DEFAULT 'USD' NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_date DATE,
    end_date DATE,
    created_by UUID,
    votes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.timeline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    cost NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    date DATE NOT NULL,
    time TEXT DEFAULT '',
    location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    added_by UUID,
    added_by_name TEXT DEFAULT 'Anonymous',
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plan_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_id, user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to trips" ON public.trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to timeline_items" ON public.timeline_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to plan_votes" ON public.plan_votes FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_votes;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.plans REPLICA IDENTITY FULL;
ALTER TABLE public.timeline_items REPLICA IDENTITY FULL;
ALTER TABLE public.plan_votes REPLICA IDENTITY FULL;`;

export const SqlSetupModal: React.FC<SqlSetupModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return localStorage.getItem('tripsync_supabase_url') || DEFAULT_SUPABASE_URL;
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    return localStorage.getItem('tripsync_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('tripsync_supabase_url', supabaseUrl.trim());
    localStorage.setItem('tripsync_supabase_anon_key', supabaseAnonKey.trim());
    setStatusMsg({
      type: 'success',
      text: 'Configuration saved! Reloading live sync...',
    });
    setTimeout(() => {
      onConfigChanged();
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem('tripsync_supabase_url');
    localStorage.removeItem('tripsync_supabase_anon_key');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setStatusMsg({
      type: 'info',
      text: 'Reverted to offline BroadcastChannel demo mode.',
    });
    setTimeout(() => {
      onConfigChanged();
      onClose();
    }, 1000);
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter both URL and Anon Key' });
      return;
    }

    setTesting(true);
    setStatusMsg(null);

    try {
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/trips?select=*&limit=1`;
      const res = await fetch(url, {
        headers: {
          apikey: supabaseAnonKey.trim(),
          Authorization: `Bearer ${supabaseAnonKey.trim()}`,
        },
      });

      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: 'Connection verified! Your Supabase database is reachable.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `Connection failed (HTTP ${res.status}). Ensure you ran the SQL script and table "trips" exists.`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Network check failed: ${err.message}. Make sure URL is correct.`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="sql-setup-modal"
        className="w-full sm:max-w-2xl bg-[#FAF8F5] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[90vh] font-sans"
      >
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-white/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B7065]/15 text-[#5B7065] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 text-base tracking-wide">{t('modals.sqlSetup.title')}</h3>
              <p className="text-xs text-stone-500">{t('modals.sqlSetup.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Free Tier Callout */}
          <div className="bg-white border border-stone-200/80 shadow-2xs rounded-2xl p-4 flex items-start space-x-3 text-xs text-stone-700">
            <ShieldCheck className="w-5 h-5 text-[#5B7065] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-stone-800">{t('modals.sqlSetup.freeNoticeTitle')}</h4>
              <p className="text-stone-600 mt-0.5 leading-relaxed">
                {t('modals.sqlSetup.freeNoticeDesc')}
              </p>
            </div>
          </div>

          {/* Step 1: SQL Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                1. {t('modals.sqlSetup.step1')}
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#5B7065]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('modals.sqlSetup.copiedSql') : t('modals.sqlSetup.copySql')}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36 leading-relaxed">
              {SUPABASE_SQL_SCRIPT}
            </pre>
          </div>

          {/* Step 2: Connection URL & Key */}
          <form onSubmit={handleSaveCredentials} className="space-y-4 pt-2 border-t border-stone-200/70">
            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider block">
              2. {t('modals.sqlSetup.step2')}
            </span>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                {t('modals.sqlSetup.projectUrl')}
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-xs font-mono min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                {t('modals.sqlSetup.anonKey')}
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-xs font-mono min-h-[44px]"
                />
              </div>
            </div>

            {statusMsg && (
              <div className={`p-3 rounded-xl text-xs ${
                statusMsg.type === 'success' 
                  ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-800'
                  : statusMsg.type === 'error'
                  ? 'bg-red-50/80 border border-red-200 text-red-800'
                  : 'bg-stone-100 border border-stone-200 text-stone-800'
              }`}>
                {statusMsg.text}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestConnection}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5B7065]" />
                  <span>{testing ? t('modals.sqlSetup.testing') : t('modals.sqlSetup.testBtn')}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] text-xs text-stone-600 hover:text-stone-900 hover:underline inline-flex items-center space-x-1 px-2 py-2"
                >
                  <span>{t('modals.sqlSetup.dashboardLink')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex flex-wrap items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('auth.signOutConfirm'))) {
                      revokeAccessAuthorization();
                      window.location.reload();
                    }
                  }}
                  className="min-h-[44px] px-3 py-2 text-xs font-medium text-[#A25A60] hover:text-red-700 hover:bg-[#F5ECEB] rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                  title={t('auth.signOut')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('auth.signOutShort')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-[44px] px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('modals.sqlSetup.clearDemo')}</span>
                </button>

                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-white bg-[#5B7065] hover:bg-[#4D5F56] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('modals.sqlSetup.applyBtn')}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
