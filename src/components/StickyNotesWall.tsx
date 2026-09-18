/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  Pin, 
  Plus, 
  Trash2, 
  Sparkles, 
  StickyNote, 
  Check,
  Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSupabase } from '../lib/supabase';
import { generateUUID, isValidUUID } from '../lib/uuid';

export type WashiColor = 'oat' | 'matcha' | 'sakura' | 'barley' | 'slate';

export interface StickyNoteItem {
  id: string;
  tripId: string;
  text: string;
  color: WashiColor;
  authorId: string;
  authorName: string;
  authorColor: string;
  isPinned: boolean;
  createdAt: string;
  rotation: number;
}

interface StickyNoteRow {
  id: string;
  trip_id: string;
  text: string;
  color: WashiColor;
  author_id: string;
  author_name: string;
  author_color: string;
  is_pinned: boolean;
  created_at: string;
  rotation: number;
}

interface StickyNotesWallProps {
  tripId: string;
  currentUser: UserProfile;
  onNotesCountChange?: (count: number) => void;
}

const WASHI_THEMES: Record<WashiColor, {
  nameKey: string;
  cardBg: string;
  border: string;
  tapeBg: string;
  dotColor: string;
  textColor: string;
  hexLabel: string;
}> = {
  oat: {
    nameKey: 'colorOat',
    cardBg: 'bg-[#F4F0EA]',
    border: 'border-[#E5DDD2]',
    tapeBg: 'bg-[#DDD5C7]/90',
    dotColor: '#8C7A6B',
    textColor: 'text-stone-800',
    hexLabel: '#F4F0EA',
  },
  matcha: {
    nameKey: 'colorMatcha',
    cardBg: 'bg-[#E8EFE6]',
    border: 'border-[#D6E2D4]',
    tapeBg: 'bg-[#CCDCD0]/90',
    dotColor: '#5B7065',
    textColor: 'text-stone-800',
    hexLabel: '#E8EFE6',
  },
  sakura: {
    nameKey: 'colorSakura',
    cardBg: 'bg-[#F5ECEB]',
    border: 'border-[#EBDCDD]',
    tapeBg: 'bg-[#E2CFD2]/90',
    dotColor: '#B87278',
    textColor: 'text-stone-800',
    hexLabel: '#F5ECEB',
  },
  barley: {
    nameKey: 'colorBarley',
    cardBg: 'bg-[#FAF4E8]',
    border: 'border-[#EDE3D0]',
    tapeBg: 'bg-[#E3D6BC]/90',
    dotColor: '#9C824E',
    textColor: 'text-stone-800',
    hexLabel: '#FAF4E8',
  },
  slate: {
    nameKey: 'colorSlate',
    cardBg: 'bg-[#E6EFEF]',
    border: 'border-[#D3E3E3]',
    tapeBg: 'bg-[#CADADA]/90',
    dotColor: '#596B7D',
    textColor: 'text-stone-800',
    hexLabel: '#E6EFEF',
  },
};

const ROTATION_OPTIONS = [-1.5, 1.2, -0.8, 1.8, -1.1, 0.6, -1.6, 1.4];

const fromDatabaseRow = (row: StickyNoteRow): StickyNoteItem => ({
  id: row.id,
  tripId: row.trip_id,
  text: row.text,
  color: row.color,
  authorId: row.author_id,
  authorName: row.author_name,
  authorColor: row.author_color,
  isPinned: row.is_pinned,
  createdAt: row.created_at,
  rotation: Number(row.rotation),
});

const toDatabaseRow = (note: StickyNoteItem): StickyNoteRow => ({
  id: note.id,
  trip_id: note.tripId,
  text: note.text,
  color: note.color,
  author_id: note.authorId,
  author_name: note.authorName,
  author_color: note.authorColor,
  is_pinned: note.isPinned,
  created_at: note.createdAt,
  rotation: note.rotation,
});

export const StickyNotesWall: React.FC<StickyNotesWallProps> = ({
  tripId,
  currentUser,
  onNotesCountChange,
}) => {
  const { t } = useTranslation();
  const storageKey = `tripsync_washi_notes_${tripId}`;

  const [notes, setNotes] = useState<StickyNoteItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    // Default welcome washi notes
    return [
      {
        id: 'note-welcome-1',
        tripId,
        text: '准备清单：护照有效期 > 6个月、漫游流量包、交通卡 (Suica) 提前绑定手机钱包、备用外币现钞。',
        color: 'matcha',
        authorId: 'system',
        authorName: 'TripSync',
        authorColor: '#5B7065',
        isPinned: true,
        createdAt: new Date().toISOString(),
        rotation: -1.2,
      },
      {
        id: 'note-welcome-2',
        tripId,
        text: '想吃的地道居酒屋：新宿回忆横丁、银座鸡白汤拉面、筑地市场海鲜丼。记得避开周三定休日！',
        color: 'barley',
        authorId: 'system',
        authorName: 'TripSync',
        authorColor: '#8C7A6B',
        isPinned: false,
        createdAt: new Date().toISOString(),
        rotation: 0.9,
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [selectedColor, setSelectedColor] = useState<WashiColor>('matcha');
  const [syncState, setSyncState] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');

  // Notify parent of notes count
  useEffect(() => {
    if (onNotesCountChange) {
      onNotesCountChange(notes.length);
    }
  }, [notes.length, onNotesCountChange]);

  // Save notes locally and broadcast
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    }
  }, [notes, storageKey]);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setNotes(JSON.parse(e.newValue));
        } catch (err) {
          console.warn(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setSyncState('local');
      return;
    }

    let isMounted = true;
    setSyncState('syncing');

    const loadNotes = async () => {
      const { data, error } = await supabase
        .from('sticky_notes')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load sticky notes from Supabase:', error);
        setSyncState('error');
        return;
      }

      if (data && data.length > 0) {
        setNotes((data as StickyNoteRow[]).map(fromDatabaseRow));
      } else if (notes.length > 0) {
        const migratedNotes = notes.map((note) => ({
          ...note,
          id: isValidUUID(note.id) ? note.id : generateUUID(),
        }));
        const { error: migrationError } = await supabase
          .from('sticky_notes')
          .upsert(migratedNotes.map(toDatabaseRow));

        if (!isMounted) return;
        if (migrationError) {
          console.error('Failed to migrate local sticky notes:', migrationError);
          setSyncState('error');
          return;
        }
        setNotes(migratedNotes);
      }
      setSyncState('synced');
    };

    loadNotes();

    const channel = supabase
      .channel(`sticky-notes-${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sticky_notes', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id?: string };
            if (deleted.id) setNotes((prev) => prev.filter((note) => note.id !== deleted.id));
            return;
          }

          const changed = fromDatabaseRow(payload.new as StickyNoteRow);
          setNotes((prev) => {
            const index = prev.findIndex((note) => note.id === changed.id);
            if (index < 0) return [changed, ...prev];
            const next = [...prev];
            next[index] = changed;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const saveNoteToDatabase = async (note: StickyNoteItem) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('sticky_notes').upsert(toDatabaseRow(note));
    if (error) {
      console.error('Failed to save sticky note:', error);
      setSyncState('error');
    } else {
      setSyncState('synced');
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const randomRot = ROTATION_OPTIONS[Math.floor(Math.random() * ROTATION_OPTIONS.length)];
    const newNote: StickyNoteItem = {
      id: generateUUID(),
      tripId,
      text: inputText.trim(),
      color: selectedColor,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorColor: currentUser.color || '#5B7065',
      isPinned: false,
      createdAt: new Date().toISOString(),
      rotation: randomRot,
    };

    setNotes((prev) => [newNote, ...prev]);
    saveNoteToDatabase(newNote);
    setInputText('');
  };

  const handleTogglePin = (id: string) => {
    const note = notes.find((candidate) => candidate.id === id);
    if (!note) return;
    const updatedNote = { ...note, isPinned: !note.isPinned };
    setNotes((prev) => prev.map((candidate) => candidate.id === id ? updatedNote : candidate));
    saveNoteToDatabase(updatedNote);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('sticky_notes').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error('Failed to delete sticky note:', error);
          setSyncState('error');
        }
      });
    }
  };

  // Pinned notes appear first
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300 w-full overflow-x-hidden">
      {/* 1. Memo Input Box & Washi Color Cards */}
      <div className="bg-white/95 border border-stone-200/80 rounded-2xl p-4 sm:p-6 shadow-wabi">
        <div className="space-y-1 sm:space-y-1.5 mb-4">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#5B7065]/10 border border-[#5B7065]/20 text-[#5B7065] text-xs font-medium tracking-wide">
            <StickyNote className="w-3.5 h-3.5" />
            <span>{t('stickyNotes.cornerTitle')}</span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            {t('stickyNotes.cornerDesc')}
          </p>
          <p className={`text-[11px] ${syncState === 'error' ? 'text-[#A25A60]' : 'text-stone-400'}`}>
            {t(`stickyNotes.sync.${syncState}`)}
          </p>
        </div>

        {/* 2. New Memo Form */}
        <form onSubmit={handleAddNote} className="space-y-4">
          <div className="relative">
            <textarea
              id="washi-memo-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('stickyNotes.addNotePlaceholder')}
              rows={3}
              className="w-full bg-[#FAF8F5]/80 rounded-xl border border-stone-200/90 p-3.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400/20 shadow-xs resize-none transition-all leading-relaxed"
            />
          </div>

          {/* Washi Paper Swatches - Fixed Mobile Layout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-600 block">
                {t('stickyNotes.selectColor')}
              </label>
              <span className="text-[11px] text-stone-400 hidden sm:inline">
                {t(`stickyNotes.${WASHI_THEMES[selectedColor].nameKey}`)} ({WASHI_THEMES[selectedColor].hexLabel})
              </span>
            </div>

            {/* Responsive Grid: 2 columns on mobile, 3 on tablet, 5 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5 w-full">
              {(['oat', 'matcha', 'sakura', 'barley', 'slate'] as WashiColor[]).map((c) => {
                const theme = WASHI_THEMES[c];
                const isSelected = selectedColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`relative p-2.5 sm:p-3 min-h-[56px] sm:min-h-[50px] rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${theme.cardBg} ${theme.border} ${
                      isSelected
                        ? 'ring-2 ring-stone-700/80 shadow-xs border-stone-400'
                        : 'hover:border-stone-300 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-1">
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white/70" 
                        style={{ backgroundColor: theme.dotColor }}
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-medium text-stone-800 break-words leading-tight">
                          {t(`stickyNotes.${theme.nameKey}`)}
                        </span>
                        <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                          {theme.hexLabel}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-stone-700 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] disabled:opacity-40 disabled:hover:bg-[#5B7065] text-white text-xs sm:text-sm font-medium shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{t('stickyNotes.pinBtn')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Sticky Notes Grid */}
      {sortedNotes.length === 0 ? (
        <div className="bg-white/80 rounded-2xl border border-dashed border-stone-300 p-8 sm:p-10 text-center space-y-3 max-w-md mx-auto shadow-wabi">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
            <StickyNote className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-stone-800 text-sm sm:text-base">
            {t('stickyNotes.emptyTitle')}
          </h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            {t('stickyNotes.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pt-1">
          {sortedNotes.map((note) => {
            const theme = WASHI_THEMES[note.color] || WASHI_THEMES.oat;

            return (
              <div
                key={note.id}
                style={{
                  transform: `rotate(${note.rotation}deg)`,
                }}
                className={`relative group rounded-2xl border ${theme.cardBg} ${theme.border} p-4 sm:p-5 shadow-wabi transition-all hover:scale-[1.01] hover:shadow-wabi-hover flex flex-col justify-between min-h-[160px]`}
              >
                {/* Washi Masking Tape accent at top center */}
                <div 
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 rounded-xs ${theme.tapeBg} shadow-2xs pointer-events-none opacity-85`}
                  style={{
                    transform: `rotate(${note.rotation * -0.5}deg)`,
                  }}
                />

                {/* Top action bar: pin toggle & delete */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-1.5 text-[11px] text-stone-500">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-semibold shrink-0"
                      style={{ backgroundColor: note.authorColor || '#5B7065' }}
                    >
                      {note.authorName.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[120px]">{note.authorName}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleTogglePin(note.id)}
                      className={`min-h-[32px] min-w-[32px] p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                        note.isPinned
                          ? 'text-[#5B7065] bg-[#5B7065]/10 font-bold'
                          : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'
                      }`}
                      title={note.isPinned ? t('stickyNotes.unpin') : t('stickyNotes.pin')}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="min-h-[32px] min-w-[32px] p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center opacity-70 group-hover:opacity-100"
                      title={t('stickyNotes.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Content */}
                <div className="flex-1 text-xs sm:text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-wrap break-words py-1">
                  {note.text}
                </div>

                {/* Footer time & date */}
                <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                  {note.isPinned && (
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#5B7065] bg-[#5B7065]/10 px-1.5 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
