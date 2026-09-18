/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Navbar } from './components/Navbar';
import { SidebarDrawer } from './components/SidebarDrawer';
import { CreateTripModal } from './components/CreateTripModal';
import { PlanComparer } from './components/PlanComparer';
import { TimelineNodeList } from './components/TimelineNodeList';
import { StickyNotesWall } from './components/StickyNotesWall';
import { ProfileModal } from './components/ProfileModal';
import { AddEditItemModal } from './components/AddEditItemModal';
import { AddPlanModal } from './components/AddPlanModal';
import { SqlSetupModal } from './components/SqlSetupModal';
import { TripMetaModal } from './components/TripMetaModal';
import { TimelineItem, Trip } from './types';
import { 
  Bell, 
  Database,
  ShieldCheck, 
  Plus,
  Compass,
  AlertCircle,
  Radio,
  Trash2,
  ChevronDown,
  ChevronUp,
  StickyNote,
  LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isAccessAuthorized, revokeAccessAuthorization } from './lib/supabase';
import { PasswordAuthModal } from './components/PasswordAuthModal';

function MainWorkspace({ onSignOut, startInPersonaSetup = false }: { onSignOut: () => void; startInPersonaSetup?: boolean }) {
  const { t } = useTranslation();
  const {
    currentUser,
    trips,
    activeTrip,
    activeTripId,
    plans,
    timelineItems,
    teamMembers,
    userVotes,
    syncStatus,
    recentNotification,
    switchTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    upsertTimelineItem,
    deleteTimelineItem,
    addPlan,
    updatePlanName,
    deletePlan,
    toggleVote,
    updateProfile,
    removeCollaborator,
    clearLocalData,
    profilesLoaded,
  } = useRealtimeSync({ deferProfileRegistration: startInPersonaSetup });

  // Navigation and active selection
  const [activeView, setActiveView] = useState<'compare' | 'timeline'>('compare');
  const [activePlanId, setActivePlanId] = useState<string>(plans[0]?.id || '');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [notesCount, setNotesCount] = useState(0);

  // Modal dialog states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(startInPersonaSetup);
  const [isCompletingPersona, setIsCompletingPersona] = useState(startInPersonaSetup);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isSqlSetupOpen, setIsSqlSetupOpen] = useState(false);
  const [isTripMetaOpen, setIsTripMetaOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  // Timeline Item Add / Edit Modal state
  const [isAddEditItemOpen, setIsAddEditItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<TimelineItem | null>(null);
  const [itemDefaultDate, setItemDefaultDate] = useState<string | undefined>(undefined);
  const [itemPlanTargetId, setItemPlanTargetId] = useState<string>(activePlanId);

  const closeProfile = () => {
    setIsProfileOpen(false);
    setIsCompletingPersona(false);
  };

  // Switch to timeline view focusing on a specific plan
  const handleSelectPlanForEdit = (planId: string) => {
    setActivePlanId(planId);
    setActiveView('timeline');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddItem = (planId: string, defaultDate?: string) => {
    setItemToEdit(null);
    setItemPlanTargetId(planId);
    setItemDefaultDate(defaultDate);
    setIsAddEditItemOpen(true);
  };

  const handleOpenEditItem = (item: TimelineItem) => {
    setItemToEdit(item);
    setItemPlanTargetId(item.plan_id);
    setIsAddEditItemOpen(true);
  };

  // Helper function to render Supabase connection pill in footer
  const renderFooterSyncStatus = () => {
    switch (syncStatus) {
      case 'connected':
        return (
          <div className="flex items-center space-x-2 text-[#5B7065] bg-[#5B7065]/10 px-3 py-1.5 rounded-xl border border-[#5B7065]/20 text-xs font-medium tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B7065] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5B7065]"></span>
            </span>
            <span>{t('footer.connected')}</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center space-x-2 text-amber-800 bg-amber-50/90 px-3 py-1.5 rounded-xl border border-amber-200/80 text-xs font-medium tracking-wide">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{t('footer.connecting')}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-[#A85A52] bg-[#A85A52]/10 px-3 py-1.5 rounded-xl border border-[#A85A52]/20 text-xs font-medium tracking-wide">
            <AlertCircle className="w-3.5 h-3.5 text-[#A85A52]" />
            <span>{t('footer.error')}</span>
          </div>
        );
      case 'demo':
      default:
        return (
          <div className="flex items-center space-x-2 text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80 text-xs font-medium tracking-wide">
            <Radio className="w-3.5 h-3.5 text-stone-500" />
            <span>{t('footer.localMode')}</span>
          </div>
        );
    }
  };

  if (isCompletingPersona) {
    return (
      <div className="min-h-screen bg-[#F3EFE8]">
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={closeProfile}
          currentUser={currentUser}
          onSave={updateProfile}
          mode="select"
          existingProfiles={teamMembers}
          profilesLoaded={profilesLoaded}
          onSelectProfile={updateProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col font-sans selection:bg-[#5B7065]/20 selection:text-stone-900 overflow-x-hidden">
      {/* 1. Top Minimalist Header */}
      <Navbar
        trip={activeTrip}
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* 2. Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Real-time Collaboration Notification Toast */}
        {recentNotification && (
          <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-xs sm:max-w-md">
            <div className="bg-stone-900/90 backdrop-blur-xs text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl border border-stone-700/80 flex items-center space-x-2.5 text-xs font-sans">
              <div className="w-6 h-6 rounded-full bg-[#5B7065] flex items-center justify-center text-white shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="font-medium text-stone-300">{recentNotification.userName} </span>
                <span className="text-stone-200">{recentNotification.actionText}</span>
              </div>
            </div>
          </div>
        )}

        {/* Check if there are any trips */}
        {trips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-stone-200/90 shadow-wabi text-center space-y-5 max-w-2xl mx-auto my-6 sm:my-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#5B7065]/15 text-[#5B7065] flex items-center justify-center mx-auto border border-[#5B7065]/20">
              <Compass className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 tracking-tight font-serif">
                {t('sidebar.noTripsYet')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                {t('sidebar.noTripsDesc')}
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                id="empty-state-create-trip-btn"
                onClick={() => setIsCreateTripOpen(true)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs sm:text-sm font-medium shadow-xs transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('sidebar.newTrip')}</span>
              </button>

              <button
                onClick={() => setIsSqlSetupOpen(true)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/90 text-stone-700 text-xs sm:text-sm font-medium transition-all cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Database className="w-4 h-4 text-stone-500" />
                <span>{t('footer.configBtn')}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* View Component Switching */}
            {activeView === 'compare' ? (
              <PlanComparer
                plans={plans}
                timelineItems={timelineItems}
                userVotes={userVotes}
                onToggleVote={toggleVote}
                onSelectPlanForEdit={handleSelectPlanForEdit}
                onOpenAddPlan={() => setIsAddPlanOpen(true)}
                onDeletePlan={deletePlan}
                onUpdatePlanName={updatePlanName}
                currency={activeTrip?.currency || 'USD'}
              />
            ) : (
              <TimelineNodeList
                plans={plans}
                activePlanId={activePlanId || plans[0]?.id || ''}
                onSelectPlan={setActivePlanId}
                timelineItems={timelineItems}
                onOpenAddItem={handleOpenAddItem}
                onOpenEditItem={handleOpenEditItem}
                onDeleteItem={deleteTimelineItem}
                currency={activeTrip?.currency || 'USD'}
                onOpenAddPlan={() => setIsAddPlanOpen(true)}
              />
            )}

            {/* 2. Decoupled Thoughts & Notes Corner (随想便签角) */}
            <div id="thoughts-notes-section" className="mt-10 pt-8 border-t border-stone-200/70">
              <div className="bg-white/85 rounded-2xl border border-stone-200/80 shadow-wabi overflow-hidden transition-all">
                {/* Collapsible Header Bar */}
                <div 
                  onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/70 transition-colors select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#5B7065]/10 border border-[#5B7065]/20 flex items-center justify-center text-[#5B7065] shrink-0 shadow-2xs">
                      <StickyNote className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm sm:text-base font-semibold text-stone-800 tracking-wide font-serif">
                          {t('stickyNotes.cornerTitle')}
                        </h3>
                        <span className="text-[11px] font-medium text-[#5B7065] bg-[#5B7065]/10 px-2 py-0.5 rounded-full shrink-0">
                          {t('stickyNotes.noteCount', { count: notesCount })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 truncate mt-0.5 hidden sm:block">
                        {t('stickyNotes.cornerDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!isNotesExpanded && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNotesExpanded(true);
                          setTimeout(() => {
                            document.getElementById('washi-memo-textarea')?.focus();
                          }, 100);
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('stickyNotes.quickAdd')}</span>
                      </button>
                    )}

                    <div className="min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors">
                      {isNotesExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Keep mounted while collapsed so the badge stays synced. */}
                <div
                  className={isNotesExpanded
                    ? 'p-4 sm:p-6 pt-0 border-t border-stone-100 bg-[#FAF8F5]/30 animate-in fade-in duration-300'
                    : 'hidden'}
                >
                  <StickyNotesWall
                    key={activeTrip.id}
                    tripId={activeTrip.id}
                    currentUser={currentUser}
                    onNotesCountChange={setNotesCount}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Quick Access Button for Sticky Notes */}
      {activeTrip && (
        <button
          id="floating-notes-toggle-btn"
          onClick={() => {
            if (!isNotesExpanded) {
              setIsNotesExpanded(true);
            }
            setTimeout(() => {
              document.getElementById('thoughts-notes-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          }}
          className="fixed bottom-6 right-6 z-30 min-h-[44px] px-4 py-2.5 rounded-full bg-stone-900/90 hover:bg-stone-900 text-stone-100 border border-stone-700/60 shadow-wabi-hover backdrop-blur-md flex items-center space-x-2 transition-all cursor-pointer hover:scale-105 active:scale-95 group"
          title={t('stickyNotes.cornerTitle')}
        >
          <StickyNote className="w-4 h-4 text-[#E5DEC7] group-hover:rotate-6 transition-transform" />
          <span className="text-xs font-medium tracking-wide">
            {t('stickyNotes.floatingBtn')}
          </span>
          <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold text-white">
            {notesCount}
          </span>
        </button>
      )}

      {/* 3. Restructured Footer with Supabase Connection & Settings */}
      <footer className="border-t border-stone-200/80 bg-white/70 backdrop-blur-xs py-6 mt-12 text-stone-600 shadow-2xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: App branding & static hosting description */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#5B7065] flex items-center justify-center text-white text-xs font-medium">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-stone-800 text-sm tracking-wide font-serif">
                  {t('common.appTitle')}
                </span>
              </div>
              <span className="hidden sm:inline text-stone-300">•</span>
              <p className="text-xs text-stone-500 max-w-md">
                {t('footer.staticDeployTip')}
              </p>
            </div>

            {/* Right: Supabase Live Connection Status & Setup Button */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {renderFooterSyncStatus()}

              <button
                id="footer-supabase-config-btn"
                onClick={() => setIsSqlSetupOpen(true)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-stone-100 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-[#5B7065]" />
                <span>{t('footer.configBtn')}</span>
              </button>

              <button
                id="footer-sign-out-btn"
                onClick={() => {
                  if (confirm(t('auth.signOutConfirm'))) {
                    onSignOut();
                  }
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F5ECEB] text-stone-700 hover:text-[#A25A60] border border-stone-200/90 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                title={t('auth.signOut')}
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">{t('auth.signOutShort')}</span>
              </button>

              {trips.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(t('common.clear') + '?')) {
                      clearLocalData();
                    }
                  }}
                  className="min-h-[40px] p-2 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                  title={t('common.clear')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* 4. Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        trips={trips}
        activeTrip={activeTrip}
        onSelectTrip={(tripId) => {
          switchTrip(tripId);
          setIsSidebarOpen(false);
        }}
        onOpenCreateTrip={() => {
          setIsSidebarOpen(false);
          setIsCreateTripOpen(true);
        }}
        onOpenEditTripMeta={(trip) => {
          setIsSidebarOpen(false);
          setTripToEdit(trip || activeTrip);
          setIsTripMetaOpen(true);
        }}
        onDeleteTrip={deleteTrip}
        currentUser={currentUser}
        onOpenProfile={() => {
          setIsSidebarOpen(false);
          setIsProfileOpen(true);
        }}
        teamMembers={teamMembers}
        onRemoveCollaborator={removeCollaborator}
        onSignOut={onSignOut}
      />

      {/* 5. Modals */}
      <CreateTripModal
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onCreateTrip={async (data) => {
          await createTrip(data);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={closeProfile}
        currentUser={currentUser}
        onSave={updateProfile}
      />

      <AddEditItemModal
        isOpen={isAddEditItemOpen}
        onClose={() => setIsAddEditItemOpen(false)}
        planId={itemPlanTargetId || plans[0]?.id || ''}
        defaultDate={itemDefaultDate}
        itemToEdit={itemToEdit}
        onSave={upsertTimelineItem}
        currentUser={currentUser}
        currency={activeTrip?.currency || 'USD'}
      />

      <AddPlanModal
        isOpen={isAddPlanOpen}
        onClose={() => setIsAddPlanOpen(false)}
        onAddPlan={addPlan}
        defaultStartDate={plans[0]?.start_date}
        defaultEndDate={plans[0]?.end_date}
      />

      <SqlSetupModal
        isOpen={isSqlSetupOpen}
        onClose={() => setIsSqlSetupOpen(false)}
        onConfigChanged={() => {
          window.location.reload();
        }}
      />

      {(tripToEdit || activeTrip) && (
        <TripMetaModal
          isOpen={isTripMetaOpen}
          onClose={() => {
            setIsTripMetaOpen(false);
            setTripToEdit(null);
          }}
          trip={tripToEdit || activeTrip!}
          onSave={updateTrip}
        />
      )}
    </div>
  );
}

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => isAccessAuthorized());
  const [shouldSetUpPersona, setShouldSetUpPersona] = useState(false);

  const handleSignOut = () => {
    revokeAccessAuthorization();
    setIsAuthorized(false);
    setShouldSetUpPersona(false);
  };

  if (!isAuthorized) {
    return (
      <PasswordAuthModal
        onUnlocked={() => {
          setShouldSetUpPersona(true);
          setIsAuthorized(true);
        }}
      />
    );
  }

  return <MainWorkspace onSignOut={handleSignOut} startInPersonaSetup={shouldSetUpPersona} />;
}
