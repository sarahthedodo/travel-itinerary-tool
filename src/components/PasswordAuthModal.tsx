/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Languages,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';
import { verifyAndAuthorizePassword, PRESET_ACCESS_PASSWORD } from '../lib/supabase';

interface PasswordAuthModalProps {
  onUnlocked: () => void;
}

export const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({ onUnlocked }) => {
  const { t, i18n } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLanguageToggle = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    setAppLanguage(nextLang);
  };

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMsg(t('auth.enterPasswordPrompt'));
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Verify password with predefined logic
    const isSuccess = verifyAndAuthorizePassword(password);

    if (isSuccess) {
      setTimeout(() => {
        setIsSubmitting(false);
        onUnlocked();
      }, 350);
    } else {
      setIsSubmitting(false);
      setErrorMsg(t('auth.wrongPassword'));
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4EE] flex flex-col justify-between items-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Zen Texture Accent */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(#D8D2C4 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header: Brand & Language Switcher */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#5B7065] text-white flex items-center justify-center shadow-2xs">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-serif font-bold text-stone-800 text-base tracking-wide">
            {t('common.appTitle')}
          </span>
        </div>

        <button
          onClick={handleLanguageToggle}
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-stone-200/80 text-xs font-medium text-stone-700 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          title="Switch Language / 切换语言"
        >
          <Languages className="w-3.5 h-3.5 text-stone-500" />
          <span>{i18n.language.startsWith('zh') ? 'EN' : '中文'}</span>
        </button>
      </header>

      {/* Centered Wabi-Sabi Unlock Card */}
      <main className="w-full max-w-md my-auto z-10">
        <div className="relative bg-[#FCFAF7] border border-[#E5DDD2] rounded-3xl p-6 sm:p-8 shadow-wabi transition-all">
          {/* Top Washi Tape Visual Accent */}
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#DDD5C7]/90 rounded-xs shadow-2xs pointer-events-none"
            style={{
              clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)'
            }}
          />

          {/* Icon & Title */}
          <div className="text-center space-y-2 mb-6 sm:mb-8 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-[#5B7065]/10 border border-[#5B7065]/20 text-[#5B7065] flex items-center justify-center mx-auto shadow-2xs">
              <KeyRound className="w-6 h-6" />
            </div>

            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-800 tracking-tight">
              {t('auth.title')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
              {t('auth.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                
                <input
                  ref={inputRef}
                  id="access-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                  className="w-full bg-[#FAF8F5] rounded-2xl border border-stone-200/90 pl-10 pr-11 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#5B7065] focus:ring-2 focus:ring-[#5B7065]/20 shadow-2xs transition-all font-sans"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div 
                id="password-error-msg"
                className="bg-[#F5ECEB] border border-[#EBDCDD] text-[#A25A60] rounded-2xl p-3 text-xs flex items-center space-x-2 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="submit-password-btn"
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full min-h-[48px] rounded-2xl bg-[#5B7065] hover:bg-[#4D5F56] disabled:opacity-40 disabled:hover:bg-[#5B7065] text-white text-sm font-medium tracking-wide shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('auth.unlockBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Calm Wabi-Sabi Divider & Quote */}
          <div className="mt-6 pt-5 border-t border-stone-200/60 text-center space-y-1.5">
            <p className="text-[11px] text-stone-400 tracking-wider">
              {t('auth.wabiSabiTip')}
            </p>
            <p className="text-[10px] text-stone-400/80 font-mono">
              {t('auth.defaultTip')}: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-500 font-semibold">{PRESET_ACCESS_PASSWORD}</code>
            </p>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-2 z-10">
        <p className="text-[11px] text-stone-400">
          TripSync • {t('common.appSubtitle')}
        </p>
      </footer>
    </div>
  );
};
