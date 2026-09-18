/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trip, UserProfile, SyncStatus } from '../types';
import { 
  Compass, 
  Copy, 
  Check, 
  Database, 
  BarChart3, 
  ListTree, 
  Edit,
  Languages,
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';

interface NavbarProps {
  trip: Trip;
  currentUser: UserProfile;
  teamMembers: UserProfile[];
  syncStatus: SyncStatus;
  activeView: 'compare' | 'timeline';
  onViewChange: (view: 'compare' | 'timeline') => void;
  onOpenProfile: () => void;
  onOpenSqlSetup: () => void;
  onOpenTripMeta: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  trip,
  currentUser,
  teamMembers,
  syncStatus,
  activeView,
  onViewChange,
  onOpenProfile,
  onOpenSqlSetup,
  onOpenTripMeta,
}) => {
  const { t, i18n } = useTranslation();
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const handleCopyInvite = () => {
    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}?invite=${trip.invite_code}` : trip.invite_code;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    setAppLanguage(nextLang);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Left: Brand & Trip Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <Compass className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md hidden sm:inline">
                  {t('common.appTitle')}
                </span>
                <button
                  onClick={onOpenTripMeta}
                  className="font-bold text-slate-900 text-xs sm:text-base truncate hover:text-blue-600 transition-colors flex items-center space-x-1 cursor-pointer min-h-[36px]"
                  title={t('navbar.editSettings')}
                >
                  <span className="truncate max-w-[140px] sm:max-w-xs">{trip.title}</span>
                  <Edit className="w-3 h-3 text-slate-400 shrink-0 hidden sm:inline" />
                </button>
              </div>

              <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-slate-500">
                <span className="truncate max-w-[120px] sm:max-w-none">{trip.destination || 'Global'}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">{trip.currency}</span>
              </div>
            </div>
          </div>

          {/* Middle: Desktop Mode Switcher (Compare vs Timeline) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="nav-compare-view-btn"
              onClick={() => onViewChange('compare')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer min-h-[36px] ${
                activeView === 'compare'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t('navbar.compareView')}</span>
            </button>

            <button
              id="nav-timeline-view-btn"
              onClick={() => onViewChange('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer min-h-[36px] ${
                activeView === 'timeline'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>{t('navbar.timelineView')}</span>
            </button>
          </div>

          {/* Right: Language + Invite + Team + DB + Profile */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Language Switcher Button */}
            <button
              id="language-switcher-btn"
              onClick={toggleLanguage}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1 transition-all cursor-pointer min-h-[38px] sm:min-h-[40px] shadow-2xs"
              title={t('navbar.switchLang')}
            >
              <Languages className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-bold">{i18n.language.startsWith('zh') ? '中文' : 'EN'}</span>
            </button>

            {/* Invite Button */}
            <button
              id="copy-invite-code-btn"
              onClick={handleCopyInvite}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-xs font-semibold text-slate-700 hover:text-blue-700 flex items-center space-x-1 transition-all cursor-pointer min-h-[38px] sm:min-h-[40px] shadow-2xs"
              title={t('common.copyInvite')}
            >
              {copiedInvite ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="font-mono text-slate-900 text-[11px] sm:text-xs truncate max-w-[70px] sm:max-w-none">
                {trip.invite_code}
              </span>
            </button>

            {/* Online Collaborator Avatar Stack */}
            <div className="relative">
              <button
                onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                className="flex items-center -space-x-1.5 hover:opacity-90 transition-opacity cursor-pointer p-1 rounded-lg hover:bg-slate-100 min-h-[38px] min-w-[38px]"
                title={t('navbar.collaborators')}
              >
                {teamMembers.slice(0, 2).map((member, idx) => (
                  <div
                    key={member.id || idx}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white flex items-center justify-center text-[11px] shadow-xs font-semibold"
                    style={{ backgroundColor: `${member.color || '#3B82F6'}20`, color: member.color || '#3B82F6' }}
                  >
                    {member.avatar_url && !member.avatar_url.startsWith('http') ? (
                      member.avatar_url
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
                {teamMembers.length > 2 && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-700">
                    +{teamMembers.length - 2}
                  </div>
                )}
              </button>

              {/* Team Dropdown */}
              {showTeamDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 space-y-2 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-xs font-semibold text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{t('navbar.collaborators')}</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {teamMembers.length} {t('common.online')}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center space-x-2 text-xs py-1">
                        <span className="text-base">{m.avatar_url || '👤'}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-slate-800 block truncate">
                            {m.name} {m.id === currentUser.id ? `(${t('common.you')})` : ''}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {m.last_active || t('common.online')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Database & Realtime Status Badge */}
            <button
              id="open-sql-setup-btn"
              onClick={onOpenSqlSetup}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer min-h-[38px] sm:min-h-[40px] ${
                syncStatus === 'connected'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : syncStatus === 'connecting'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Database & Realtime Status"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden lg:inline">
                {syncStatus === 'connected'
                  ? t('navbar.supabaseLive')
                  : syncStatus === 'connecting'
                  ? t('navbar.connecting')
                  : t('navbar.localSync')}
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
              }`} />
            </button>

            {/* Current User Profile Trigger */}
            <button
              id="user-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer min-h-[38px] min-w-[38px]"
              title={currentUser.name}
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm shadow-xs border"
                style={{
                  backgroundColor: `${currentUser.color || '#2563EB'}15`,
                  borderColor: currentUser.color || '#2563EB',
                }}
              >
                {currentUser.avatar_url}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Tab bar for small screens) */}
        <div className="flex md:hidden items-center justify-center pb-2.5 pt-1 border-t border-slate-100">
          <div className="grid grid-cols-2 w-full gap-2">
            <button
              onClick={() => onViewChange('compare')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 min-h-[44px] transition-colors ${
                activeView === 'compare'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('navbar.compareView')}</span>
            </button>

            <button
              onClick={() => onViewChange('timeline')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 min-h-[44px] transition-colors ${
                activeView === 'timeline'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ListTree className="w-4 h-4" />
              <span>{t('navbar.timelineView')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
