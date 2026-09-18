/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trip, UserProfile } from '../types';
import { 
  X, 
  Compass, 
  Plus, 
  Check, 
  Copy, 
  Settings2, 
  Trash2, 
  Users, 
  Edit,
  MapPin,
  Calendar,
  Sparkles,
  StickyNote,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  activeTrip: Trip | null;
  onSelectTrip: (tripId: string) => void;
  onOpenCreateTrip: () => void;
  onOpenEditTripMeta: () => void;
  onDeleteTrip: (tripId: string) => void;
  currentUser: UserProfile;
  onOpenProfile: () => void;
  teamMembers: UserProfile[];
  onOpenNotes?: () => void;
  notesCount?: number;
  onSignOut?: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  trips,
  activeTrip,
  onSelectTrip,
  onOpenCreateTrip,
  onOpenEditTripMeta,
  onDeleteTrip,
  currentUser,
  onOpenProfile,
  teamMembers,
  onOpenNotes,
  notesCount,
  onSignOut,
}) => {
  const { t } = useTranslation();
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  const handleCopyInvite = () => {
    if (!activeTrip) return;
    const inviteUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}?invite=${activeTrip.invite_code}` 
      : activeTrip.invite_code;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div 
          id="sidebar-drawer-panel"
          className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col h-full border-r border-stone-200/80 animate-in slide-in-from-left duration-250 font-sans"
        >
          {/* Top Drawer Header */}
          <div className="px-5 py-4 border-b border-stone-200/70 flex items-center justify-between bg-white/80 backdrop-blur-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5B7065] flex items-center justify-center text-white shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-sm sm:text-base tracking-wide">
                  {t('sidebar.title')}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {t('sidebar.subtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. Current User Profile Bar */}
            <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-wabi flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-2xs border shrink-0"
                  style={{
                    backgroundColor: `${currentUser.color || '#5B7065'}15`,
                    borderColor: currentUser.color || '#5B7065',
                  }}
                >
                  {currentUser.avatar_url}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-stone-800 text-xs sm:text-sm truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] bg-stone-100 text-stone-700 font-medium px-1.5 py-0.5 rounded border border-stone-200/60">
                      {t('common.you')}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 block truncate">
                    ID: {currentUser.id.slice(0, 8)}...
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenProfile}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-stone-200/80 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 flex items-center space-x-1 transition-colors cursor-pointer shrink-0"
              >
                <Edit className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('sidebar.editProfile')}</span>
              </button>
            </div>

            {/* 2. My Trips Section (Multi-Trip Switcher) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                    {t('sidebar.myTrips')}
                  </span>
                  <span className="text-[11px] font-medium text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full">
                    {trips.length}
                  </span>
                </div>

                <button
                  id="drawer-create-trip-btn"
                  onClick={onOpenCreateTrip}
                  className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('sidebar.newTrip')}</span>
                </button>
              </div>

              {/* Trips List */}
              {trips.length === 0 ? (
                <div className="bg-white rounded-2xl p-5 text-center border border-dashed border-stone-300">
                  <Compass className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium text-stone-700">
                    {t('sidebar.noTripsYet')}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 mb-3">
                    {t('sidebar.noTripsDesc')}
                  </p>
                  <button
                    onClick={onOpenCreateTrip}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs font-medium inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('sidebar.createFirstTrip')}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                  {trips.map((tr) => {
                    const isActive = activeTrip?.id === tr.id;
                    return (
                      <div
                        key={tr.id}
                        id={`trip-card-item-${tr.id}`}
                        onClick={() => {
                          onSelectTrip(tr.id);
                        }}
                        className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-white border-[#5B7065] text-stone-800 shadow-wabi'
                            : 'bg-white/70 hover:bg-white border-stone-200/80 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-xs sm:text-sm font-semibold truncate">
                              {tr.title}
                            </h4>
                            {isActive && (
                              <span className="text-[10px] bg-[#5B7065] text-white font-medium px-1.5 py-0.5 rounded-full shrink-0 flex items-center space-x-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>{t('sidebar.activeTag')}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-stone-500 mt-1">
                            <span className="flex items-center space-x-1 truncate max-w-[150px]">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{tr.destination || t('common.global')}</span>
                            </span>
                            <span>•</span>
                            <span className="font-medium text-stone-600">{tr.currency}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {trips.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(t('sidebar.deleteTripConfirm', { title: tr.title }))) {
                                  onDeleteTrip(tr.id);
                                }
                              }}
                              className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center opacity-70 group-hover:opacity-100"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Washi Thoughts & Notes Corner */}
            {activeTrip && onOpenNotes && (
              <div className="space-y-3 pt-4 border-t border-stone-200/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-[#5B7065]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                      {t('stickyNotes.cornerTitle')}
                    </span>
                  </div>
                  {notesCount !== undefined && (
                    <span className="text-[11px] font-medium text-[#5B7065] bg-[#5B7065]/10 px-2 py-0.5 rounded-full">
                      {notesCount}
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-wabi space-y-2.5">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {t('stickyNotes.cornerDesc')}
                  </p>
                  <button
                    id="drawer-open-notes-btn"
                    onClick={onOpenNotes}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/90 text-xs font-medium text-stone-800 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <StickyNote className="w-3.5 h-3.5 text-[#5B7065]" />
                    <span>{t('stickyNotes.title')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Travel Theme Settings (Active Trip) */}
            {activeTrip && (
              <div className="space-y-3 pt-4 border-t border-stone-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                    {t('sidebar.tripThemeSettings')}
                  </span>
                  <button
                    onClick={onOpenEditTripMeta}
                    className="text-xs font-medium text-[#5B7065] hover:text-[#4D5F56] flex items-center space-x-1 min-h-[36px] px-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{t('sidebar.editTheme')}</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-wabi space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                      {t('modals.tripMeta.name')}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-stone-800 block mt-0.5">
                      {activeTrip.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                        {t('modals.tripMeta.destination')}
                      </span>
                      <span className="font-medium text-stone-700 block mt-0.5 truncate">
                        {activeTrip.destination || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider">
                        {t('modals.tripMeta.currency')}
                      </span>
                      <span className="font-medium text-stone-700 block mt-0.5">
                        {activeTrip.currency}
                      </span>
                    </div>
                  </div>

                  {/* Invite Code */}
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wider mb-1.5">
                      {t('common.invite')}
                    </span>
                    <div className="flex items-center justify-between bg-[#FAF8F5] px-3 py-2 rounded-xl border border-stone-200/80">
                      <span className="font-mono text-xs font-semibold text-stone-800 select-all">
                        {activeTrip.invite_code}
                      </span>
                      <button
                        onClick={handleCopyInvite}
                        className="text-xs text-[#5B7065] hover:text-[#4D5F56] font-medium flex items-center space-x-1 cursor-pointer min-h-[32px] px-2 rounded hover:bg-stone-100 transition-colors"
                      >
                        {copiedInvite ? (
                          <>
                            <Check className="w-3 h-3 text-[#5B7065]" />
                            <span className="text-[#5B7065]">{t('common.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t('sidebar.copyLink')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Active Collaborators in Room */}
            <div className="space-y-3 pt-4 border-t border-stone-200/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t('sidebar.collaboratorsTitle')}</span>
                </span>
                <span className="text-[10px] text-[#5B7065] bg-[#5B7065]/10 px-2 py-0.5 rounded-full font-medium">
                  {teamMembers.length} {t('common.online')}
                </span>
              </div>

              <div className="space-y-2">
                {teamMembers.map((m) => (
                  <div 
                    key={m.id} 
                    className="flex items-center space-x-2.5 p-2 rounded-xl bg-white border border-stone-200/70 text-xs"
                  >
                    <span className="text-base">{m.avatar_url || '👤'}</span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-stone-800 block truncate">
                        {m.name} {m.id === currentUser.id ? `(${t('common.you')})` : ''}
                      </span>
                      <span className="text-[10px] text-stone-400 block truncate">
                        {m.last_active || t('common.online')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Access Security & Sign Out */}
            {onSignOut && (
              <div className="space-y-3 pt-4 border-t border-stone-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5B7065]" />
                    <span>{t('auth.title')}</span>
                  </span>
                  <span className="text-[10px] text-[#5B7065] bg-[#5B7065]/10 px-2 py-0.5 rounded-full font-medium">
                    {t('auth.statusAuthorized')}
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-wabi space-y-2.5">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {t('auth.wabiSabiTip')}
                  </p>
                  <button
                    id="drawer-sign-out-btn"
                    onClick={() => {
                      if (confirm(t('auth.signOutConfirm'))) {
                        onSignOut();
                      }
                    }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#F5ECEB]/80 hover:bg-[#F5ECEB] border border-[#EBDCDD] text-xs font-medium text-[#A25A60] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('auth.signOut')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-stone-200/70 bg-white/70 text-center">
            <p className="text-[11px] text-stone-400 tracking-wide">
              TripSync Realtime Suite • {t('common.appSubtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
