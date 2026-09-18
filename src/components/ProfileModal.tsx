/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { X, UserCheck, Sparkles, Check, Plus, ArrowLeft, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  mode?: 'edit' | 'select';
  existingProfiles?: UserProfile[];
  profilesLoaded?: boolean;
  onSelectProfile?: (profile: UserProfile) => void;
}

const PRESET_AVATARS = ['✈️', '🎒', '🧳', '🗺️', '📸', '🏖️', '⛰️', '🍵', '🍣', '🌸', '🏮', '♨️'];
const PRESET_COLORS = [
  '#5B7065', // Moss Green
  '#8C7A6B', // Wood Brown / Flax
  '#2C3E50', // Indigo
  '#A85A52', // Persimmon / Vermilion
  '#6B607A', // Muted Iris
  '#C2884A', // Ochre / Amber
  '#4A5568', // Slate Stone
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
  mode = 'edit',
  existingProfiles = [],
  profilesLoaded = true,
  onSelectProfile,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar_url);
  const [color, setColor] = useState(currentUser.color);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(mode === 'edit');

  useEffect(() => {
    if (!isOpen) return;
    setName(currentUser.name);
    setAvatar(currentUser.avatar_url);
    setColor(currentUser.color);
    setCustomAvatarInput('');
    setIsCreatingProfile(mode === 'edit');
  }, [currentUser, isOpen, mode]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...currentUser,
      name: name.trim(),
      avatar_url: customAvatarInput.trim() || avatar,
      color,
    });
    onClose();
  };

  const showProfileForm = mode === 'edit' || isCreatingProfile;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="profile-modal"
        className="w-full sm:max-w-md bg-[#FAF8F5] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200/90 overflow-hidden max-h-[90vh] flex flex-col font-sans"
      >
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-white/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B7065]/15 text-[#5B7065] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 text-base tracking-wide">
                {mode === 'select' ? t('modals.profile.selectTitle') : t('modals.profile.title')}
              </h3>
              <p className="text-xs text-stone-500">
                {mode === 'select' ? t('modals.profile.selectSubtitle') : t('modals.profile.subtitle')}
              </p>
            </div>
          </div>
          {mode === 'edit' && (
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        {!showProfileForm ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            {!profilesLoaded ? (
              <div className="py-10 flex flex-col items-center text-center text-stone-500">
                <LoaderCircle className="w-7 h-7 text-[#5B7065] animate-spin mb-3" />
                <p className="text-sm font-medium text-stone-700">{t('modals.profile.loadingProfiles')}</p>
              </div>
            ) : (
              <>
                {existingProfiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {existingProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          onSelectProfile?.(profile);
                          onClose();
                        }}
                        className="min-h-[76px] p-3 rounded-xl bg-white hover:bg-[#F2F6F3] border border-stone-200 hover:border-[#5B7065]/50 flex items-center gap-3 text-left transition-colors cursor-pointer"
                      >
                        <span
                          className="w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: `${profile.color}18`, borderColor: profile.color }}
                        >
                          {profile.avatar_url || '👤'}
                        </span>
                        <span className="min-w-0">
                          <strong className="block text-sm font-semibold text-stone-800 truncate">{profile.name}</strong>
                          <span className="block text-[11px] text-stone-400 mt-0.5">{t('modals.profile.usePersona')}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm font-medium text-stone-700">{t('modals.profile.noProfiles')}</p>
                    <p className="text-xs text-stone-500 mt-1">{t('modals.profile.noProfilesDesc')}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsCreatingProfile(true)}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-dashed border-[#5B7065]/50 bg-[#5B7065]/5 hover:bg-[#5B7065]/10 text-[#4D5F56] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('modals.profile.createPersona')}</span>
                </button>
              </>
            )}
          </div>
        ) : (
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
          {mode === 'select' && (
            <button
              type="button"
              onClick={() => setIsCreatingProfile(false)}
              className="min-h-[40px] px-2 text-xs font-medium text-stone-600 hover:text-[#5B7065] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('modals.profile.backToProfiles')}</span>
            </button>
          )}
          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.profile.nickname')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('modals.profile.nicknamePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-sm min-h-[44px]"
            />
          </div>

          {/* Preset Travel Emojis */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.profile.chooseAvatar')}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setAvatar(emoji);
                    setCustomAvatarInput('');
                  }}
                  className={`min-h-[44px] text-2xl p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    avatar === emoji && !customAvatarInput
                      ? 'bg-[#5B7065]/15 ring-2 ring-[#5B7065] scale-105'
                      : 'bg-white hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Avatar URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.profile.customAvatar')}
            </label>
            <input
              type="url"
              value={customAvatarInput}
              onChange={(e) => setCustomAvatarInput(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-xs min-h-[40px]"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.profile.colorTag')}
            </label>
            <div className="flex items-center space-x-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-stone-400' : 'hover:opacity-90'
                  }`}
                >
                  {color === c && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Stamp */}
          <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs text-xs text-stone-600 flex items-center space-x-2.5">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-2xs border"
              style={{ backgroundColor: `${color}20`, borderColor: color }}
            >
              {customAvatarInput ? '🖼️' : avatar}
            </div>
            <div>
              <span className="text-stone-400 block text-[10px]">{t('modals.profile.previewTip')}:</span>
              <strong className="text-stone-800 font-semibold">{name || 'Your Name'}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200/70">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-medium text-white bg-[#5B7065] hover:bg-[#4D5F56] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('modals.profile.saveBtn')}</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
