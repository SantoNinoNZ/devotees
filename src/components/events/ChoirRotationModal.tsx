'use client';

import React, { useEffect } from 'react';
import type { EventWithRoster } from '@/types';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface ChoirRotationItem {
  id: string;
  sequenceLabel: string;
  venueDisplay: string;
  choirName: string;
  presiderName: string;
  sponsorChapter: string;
  status: 'Assigned Active' | 'Upcoming' | 'Combined Choirs' | string;
  variant: 'active' | 'upcoming' | 'combined';
}

export interface ChoirRotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: EventWithRoster[];
  onRegisterChapterChoir?: () => void;
}

// ==========================================
// LITURGICAL DEFAULT PRESETS
// ==========================================

export const DEFAULT_CHOIR_ROTATION_PRESETS: ChoirRotationItem[] = [
  {
    id: 'preset-mass-1',
    sequenceLabel: 'Mass 1 • Nov 14',
    venueDisplay: "St Benedict's Newton (5:30 PM)",
    choirName: 'Coro de Santo Niño (North Shore)',
    presiderName: 'Rev. Fr. Mario Gomez',
    sponsorChapter: 'Pukekohe Chapter',
    status: 'Assigned Active',
    variant: 'active',
  },
  {
    id: 'preset-mass-2',
    sequenceLabel: 'Mass 2 • Nov 21',
    venueDisplay: "St Patrick's Cathedral (5:30 PM)",
    choirName: 'Auckland Catholic Youth Choir',
    presiderName: 'Rev. Fr. Bernard Espiritu',
    sponsorChapter: 'Auckland Central',
    status: 'Upcoming',
    variant: 'upcoming',
  },
  {
    id: 'preset-mass-3',
    sequenceLabel: 'Mass 3 • Nov 28',
    venueDisplay: "St Benedict's Newton (5:30 PM)",
    choirName: 'Voices of Faith (West Auckland Chapter)',
    presiderName: 'Rev. Fr. Sherwin Lapaan',
    sponsorChapter: 'West Auckland',
    status: 'Upcoming',
    variant: 'upcoming',
  },
  {
    id: 'preset-grand-fiesta',
    sequenceLabel: 'Grand Fiesta • Jan 18',
    venueDisplay: 'Grand Sinulog Festival High Mass',
    choirName: 'Combined NZ Sinulog Festival Choirs',
    presiderName: 'Most Rev. Bishop of Auckland',
    sponsorChapter: 'All NZ Chapters',
    status: 'Combined Choirs',
    variant: 'combined',
  },
];

// ==========================================
// LITURGICAL DATA RESOLVERS & HELPERS
// ==========================================

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Formats ISO or YYYY-MM-DD date string into concise liturgical format e.g. "Nov 14" or "Jan 18".
 */
export function formatLiturgicalDate(dateString?: string | null): string {
  if (!dateString || typeof dateString !== 'string' || !dateString.trim()) {
    return 'TBD';
  }

  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, , monthStr, dayStr] = match;
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_ABBR[monthIndex]} ${parseInt(dayStr, 10)}`;
    }
  }

  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return 'TBD';
  }

  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Generates the sequence badge label (e.g. "Mass 1 • Nov 14" or "Grand Fiesta • Jan 18").
 */
export function formatSequenceLabel(
  event: Partial<EventWithRoster>,
  index: number,
  dateFormatted: string
): string {
  const title = (event.title || '').toLowerCase();
  const isGrandFiesta =
    title.includes('grand fiesta') ||
    title.includes('sinulog festival') ||
    title.includes('fiesta high mass') ||
    event.mass_sequence_number === 10;

  if (isGrandFiesta) {
    return `Grand Fiesta • ${dateFormatted}`;
  }

  const seq = event.mass_sequence_number ?? index + 1;
  return `Mass ${seq} • ${dateFormatted}`;
}

/**
 * Resolves item status tag and visual variant.
 */
export function resolveRotationStatus(
  event: Partial<EventWithRoster>,
  index: number
): { status: string; variant: 'active' | 'upcoming' | 'combined' } {
  const title = (event.title || '').toLowerCase();
  const choir = (event.choir_name || event.choir_group?.name || '').toLowerCase();

  if (
    title.includes('grand fiesta') ||
    title.includes('sinulog festival') ||
    choir.includes('combined')
  ) {
    return { status: 'Combined Choirs', variant: 'combined' };
  }

  if (index === 0) {
    return { status: 'Assigned Active', variant: 'active' };
  }

  return { status: 'Upcoming', variant: 'upcoming' };
}

/**
 * Transforms an `EventWithRoster` record into a renderable `ChoirRotationItem`.
 */
export function transformEventToRotationItem(
  event: EventWithRoster,
  index: number
): ChoirRotationItem {
  const dateFormatted = formatLiturgicalDate(
    event.event_start_date || event.start_date
  );
  const sequenceLabel = formatSequenceLabel(event, index, dateFormatted);
  const { status, variant } = resolveRotationStatus(event, index);

  const time = event.event_start_time || event.time || '5:30 PM';
  let venueDisplay = event.venue || event.title || "St Benedict's Newton";
  if (time && !venueDisplay.includes(time) && !venueDisplay.toLowerCase().includes('high mass')) {
    venueDisplay = `${venueDisplay} (${time})`;
  }

  const choirName =
    event.choir_name ||
    event.choir_group?.name ||
    'Coro de Santo Niño (Chapter Choir)';

  let presiderName = event.presider_name;
  if (!presiderName && event.presider?.display_name) {
    presiderName = `Rev. Fr. ${event.presider.display_name}`;
  }
  if (!presiderName) {
    presiderName = 'Rev. Clergy Presider';
  }

  const sponsorChapter = event.sponsor_chapter || 'Auckland Devotee Chapter';

  return {
    id: event.id || `rotation-${index + 1}`,
    sequenceLabel,
    venueDisplay,
    choirName,
    presiderName,
    sponsorChapter,
    status,
    variant,
  };
}

/**
 * Resolves the items array: returns provided transformed events or prototype defaults.
 */
export function resolveRotationItems(events?: EventWithRoster[]): ChoirRotationItem[] {
  if (!events || events.length === 0) {
    return DEFAULT_CHOIR_ROTATION_PRESETS;
  }
  return events.map((ev, idx) => transformEventToRotationItem(ev, idx));
}

/**
 * Handles the registration trigger callback or browser alert fallback.
 */
export function executeRegisterChoirAction(
  onRegisterChapterChoir?: () => void,
  fallbackAlert?: (msg: string) => void
): boolean {
  if (onRegisterChapterChoir) {
    onRegisterChapterChoir();
    return true;
  }
  const message =
    'Choir Director Connect: You can message the Music Ministry coordinator to register your chapter choir.';
  if (fallbackAlert) {
    fallbackAlert(message);
  } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  }
  return false;
}

// ==========================================
// COMPONENT
// ==========================================

export const ChoirRotationModal: React.FC<ChoirRotationModalProps> = ({
  isOpen,
  onClose,
  events,
  onRegisterChapterChoir,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = resolveRotationItems(events);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRegisterClick = () => {
    executeRegisterChoirAction(onRegisterChapterChoir);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="choir-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={handleBackdropClick}
      data-testid="choir-rotation-modal"
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl" role="img" aria-label="Music notes">
              🎶
            </span>
            <div>
              <h3
                id="choir-modal-title"
                className="font-bold text-stone-900 text-base font-cinzel"
              >
                Choir & Ministry Rotation Schedule
              </h3>
              <div className="text-[11px] font-bold text-brand-800 uppercase tracking-widest">
                Santo Niño Novena & Simbang Gabi Masses
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
            data-testid="close-modal-button"
          >
            <span className="text-base leading-none">✕</span>
          </button>
        </div>

        {/* Explanatory Note */}
        <div className="text-xs text-stone-500 leading-relaxed">
          Choir assignments and presiding clergy for upcoming community masses.
          Connect with your chapter music director for rehearsal schedules.
        </div>

        {/* Schedule List */}
        <div className="space-y-2.5" data-testid="choir-rotation-list">
          {items.map((item) => {
            const isActive =
              item.variant === 'active' || item.status === 'Assigned Active';
            const isCombined =
              item.variant === 'combined' || item.status === 'Combined Choirs';

            let containerClass =
              'p-3.5 rounded-2xl bg-white border border-[#EFEAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-stone-300 transition';
            let pillClass =
              'bg-stone-200 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-cinzel';
            let venueClass = 'text-xs font-bold text-stone-900';
            let choirTextClass = 'text-stone-900';
            let presiderClass = 'text-[11px] text-stone-500';
            let statusBadgeClass =
              'text-[10px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full self-start sm:self-auto';

            if (isActive) {
              containerClass =
                'p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs';
              pillClass =
                'bg-brand-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-cinzel';
              venueClass = 'text-xs font-bold text-brand-900';
              choirTextClass = 'text-brand-900';
              presiderClass = 'text-[11px] text-stone-500';
              statusBadgeClass =
                'text-[10px] font-bold bg-white text-brand-800 border border-brand-200 px-2.5 py-1 rounded-full self-start sm:self-auto shadow-2xs';
            } else if (isCombined) {
              containerClass =
                'p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5';
              pillClass =
                'bg-gold-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-cinzel';
              venueClass = 'text-xs font-bold text-amber-950';
              choirTextClass = 'text-brand-900';
              presiderClass = 'text-[11px] text-stone-600';
              statusBadgeClass =
                'text-[10px] font-bold bg-gold-100 text-gold-900 border border-gold-300 px-2.5 py-1 rounded-full self-start sm:self-auto';
            }

            const sponsorDisplay =
              item.sponsorChapter.startsWith('All') ||
              item.sponsorChapter.toLowerCase().includes('sponsor')
                ? item.sponsorChapter
                : `Sponsor: ${item.sponsorChapter}`;

            return (
              <div
                key={item.id}
                className={containerClass}
                data-testid={`choir-rotation-item-${item.id}`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={pillClass}>{item.sequenceLabel}</span>
                    <span className={venueClass}>{item.venueDisplay}</span>
                  </div>
                  <div className="text-xs text-stone-800 mt-1 font-semibold flex items-center gap-1.5 flex-wrap">
                    <span>🎶 Choir:</span>{' '}
                    <strong className={choirTextClass}>{item.choirName}</strong>
                  </div>
                  <div className={presiderClass}>
                    Presider: {item.presiderName} • {sponsorDisplay}
                  </div>
                </div>
                <span className={statusBadgeClass}>{item.status}</span>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex justify-between items-center">
          <button
            type="button"
            onClick={handleRegisterClick}
            className="text-xs text-brand-800 font-bold hover:underline cursor-pointer"
            data-testid="register-choir-button"
          >
            + Register Chapter Choir
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow cursor-pointer"
            data-testid="close-footer-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
