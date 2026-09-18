/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Navbar } from './components/Navbar';
import { PlanComparer } from './components/PlanComparer';
import { TimelineNodeList } from './components/TimelineNodeList';
import { ProfileModal } from './components/ProfileModal';
import { AddEditItemModal } from './components/AddEditItemModal';
import { AddPlanModal } from './components/AddPlanModal';
import { SqlSetupModal } from './components/SqlSetupModal';
import { TripMetaModal } from './components/TripMetaModal';
import { TimelineItem } from './types';
import { 
  Bell, 
  RotateCcw, 
  ShieldCheck, 
  Laptop
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation();
  const {
    currentUser,
    trip,
    plans,
    timelineItems,
    teamMembers,
    userVotes,
    syncStatus,
    recentNotification,
    upsertTimelineItem,
    deleteTimelineItem,
    addPlan,
    deletePlan,
    toggleVote,
    updateProfile,
    updateTrip,
    resetToSampleData,
  } = useRealtimeSync();

  // Navigation and active selection
  const [activeView, setActiveView] = useState<'compare' | 'timeline'>('compare');
  const [activePlanId, setActivePlanId] = useState<string>(plans[0]?.id || '');

  // Modal dialog states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isSqlSetupOpen, setIsSqlSetupOpen] = useState(false);
  const [isTripMetaOpen, setIsTripMetaOpen] = useState(false);

  // Timeline Item Add / Edit Modal state
  const [isAddEditItemOpen, setIsAddEditItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<TimelineItem | null>(null);
  const [itemDefaultDate, setItemDefaultDate] = useState<string | undefined>(undefined);
  const [itemPlanTargetId, setItemPlanTargetId] = useState<string>(activePlanId);

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

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Top Sticky Navigation */}
      <Navbar
        trip={trip}
        currentUser={currentUser}
        teamMembers={teamMembers}
        syncStatus={syncStatus}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSqlSetup={() => setIsSqlSetupOpen(true)}
        onOpenTripMeta={() => setIsTripMetaOpen(true)}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Real-time Collaboration Notification Toast */}
        {recentNotification && (
          <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-xs sm:max-w-md">
            <div className="bg-slate-900 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="font-semibold text-blue-300">{recentNotification.userName} </span>
                <span className="text-slate-200">{recentNotification.actionText}</span>
              </div>
            </div>
          </div>
        )}

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
            currency={trip.currency}
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
            currency={trip.currency}
          />
        )}

        {/* Realtime Multi-User Collaboration Demo Helper Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">
                {t('bottomHelper.title')}
              </h4>
              <p className="text-slate-500 mt-0.5 leading-relaxed">
                {t('bottomHelper.desc')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setIsSqlSetupOpen(true)}
              className="min-h-[44px] flex-1 md:flex-none px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('modals.sqlSetup.title')}</span>
            </button>

            <button
              onClick={() => {
                if (confirm(t('common.reset') + '?')) {
                  resetToSampleData();
                }
              }}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1"
              title={t('common.reset')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('common.reset')}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t('common.appTitle')} — {t('common.appSubtitle')}</span>
          <span className="text-[11px] text-slate-400">Deployable statically on GitHub Pages with Supabase Realtime</span>
        </div>
      </footer>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
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
        currency={trip.currency}
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

      <TripMetaModal
        isOpen={isTripMetaOpen}
        onClose={() => setIsTripMetaOpen(false)}
        trip={trip}
        onSave={updateTrip}
      />
    </div>
  );
}
