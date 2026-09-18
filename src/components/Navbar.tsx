/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trip, UserProfile } from '../types';
import { 
  Compass, 
  BarChart3, 
  ListTree, 
  Languages,
  Menu,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';

interface NavbarProps {
  trip: Trip | null;
  currentUser: UserProfile;
  activeView: 'compare' | 'timeline';
  onViewChange: (view: 'compare' | 'timeline') => void;
  onOpenSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  trip,
  currentUser,
  activeView,
  onViewChange,
  onOpenSidebar,
}) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    setAppLanguage(nextLang);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/85 backdrop-blur-md border-b border-stone-200/60 shadow-wabi">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left: Sidebar Toggle Button + Brand Title + Active Trip Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Sidebar Drawer Trigger */}
            <button
              id="sidebar-menu-toggle-btn"
              onClick={onOpenSidebar}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white hover:bg-stone-100/80 text-stone-700 flex items-center space-x-1.5 transition-colors cursor-pointer min-h-[44px] shrink-0 border border-stone-200/80 shadow-2xs"
              title={t('navbar.openSidebar')}
            >
              <Menu className="w-4 h-4 text-stone-700" />
              <span className="text-xs font-medium hidden sm:inline text-stone-700 tracking-wide">
                {t('navbar.menu')}
              </span>
            </button>

            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#5B7065] flex items-center justify-center text-white shadow-xs shrink-0">
                <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-stone-800 text-sm sm:text-base tracking-wide font-sans">
                    {t('common.appTitle')}
                  </span>
                  
                  {trip && (
                    <button
                      onClick={onOpenSidebar}
                      className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-medium text-stone-700 bg-stone-100/90 hover:bg-stone-200/80 border border-stone-200/80 px-2.5 py-0.5 rounded-lg truncate max-w-[160px] md:max-w-[200px] transition-colors cursor-pointer"
                      title={t('sidebar.switchTrip')}
                    >
                      <span className="truncate">{trip.title}</span>
                      <ChevronRight className="w-3 h-3 shrink-0 text-stone-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Desktop View Mode Switcher (Clean 2 options: Compare / Timeline) */}
          <div className="hidden md:flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/70">
            <button
              id="nav-compare-view-btn"
              onClick={() => onViewChange('compare')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer min-h-[36px] tracking-wide ${
                activeView === 'compare'
                  ? 'bg-white text-stone-800 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-stone-600" />
              <span>{t('navbar.compareView')}</span>
            </button>

            <button
              id="nav-timeline-view-btn"
              onClick={() => onViewChange('timeline')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer min-h-[36px] tracking-wide ${
                activeView === 'timeline'
                  ? 'bg-white text-stone-800 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <ListTree className="w-3.5 h-3.5 text-stone-600" />
              <span>{t('navbar.timelineView')}</span>
            </button>
          </div>

          {/* Right: Language Switcher (i18n) + Avatar Drawer Trigger */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Language Switcher */}
            <button
              id="header-language-switcher-btn"
              onClick={toggleLanguage}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200/90 hover:border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 flex items-center space-x-1.5 transition-all cursor-pointer min-h-[44px] shadow-2xs tracking-wide"
              title={t('navbar.switchLang')}
            >
              <Languages className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>{i18n.language.startsWith('zh') ? '中文' : 'EN'}</span>
            </button>

            {/* User Avatar Button (Opens Sidebar) */}
            <button
              id="header-user-avatar-btn"
              onClick={onOpenSidebar}
              className="flex items-center space-x-1.5 p-1 rounded-xl hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200 cursor-pointer min-h-[44px] min-w-[44px] justify-center"
              title={`${currentUser.name} (${t('navbar.openSidebar')})`}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-2xs border"
                style={{
                  backgroundColor: `${currentUser.color || '#5B7065'}15`,
                  borderColor: currentUser.color || '#5B7065',
                }}
              >
                {currentUser.avatar_url}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tab Bar (Clean 2 columns) */}
        <div className="flex md:hidden items-center justify-center pb-2.5 pt-1 border-t border-stone-100">
          <div className="grid grid-cols-2 w-full gap-2">
            <button
              onClick={() => onViewChange('compare')}
              className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 min-h-[44px] transition-colors ${
                activeView === 'compare'
                  ? 'bg-white text-stone-800 shadow-xs font-semibold border border-stone-200/80'
                  : 'bg-stone-100/70 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="truncate">{t('navbar.compareView')}</span>
            </button>

            <button
              onClick={() => onViewChange('timeline')}
              className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 min-h-[44px] transition-colors ${
                activeView === 'timeline'
                  ? 'bg-white text-stone-800 shadow-xs font-semibold border border-stone-200/80'
                  : 'bg-stone-100/70 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span className="truncate">{t('navbar.timelineView')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
