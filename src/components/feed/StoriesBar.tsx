'use client';

import React from 'react';
import { PlusOutlined } from '@ant-design/icons';

export const DEFAULT_FIESTA_TARGET_DATE = '2027-01-16T00:00:00.000Z';
export const DEFAULT_NOVENA_DAY = 3;
export const DEFAULT_TOTAL_NOVENA_DAYS = 9;
export const DEFAULT_NOVENA_THEME = 'Petitions';

export interface StoriesBarProps {
  currentNovenaDay?: number; // default 3
  totalNovenaDays?: number; // default 9
  novenaTheme?: string; // e.g. "Petitions"
  fiestaCountdownDays?: number;
  fiestaTargetDate?: Date | string;
  onOpenNovena?: (day: number) => void;
  onOpenGospel?: () => void;
  onOpenFiestaCountdown?: () => void;
  onShareReflection?: () => void;
}

export interface StoryCardConfig {
  id: 'novena' | 'gospel' | 'fiesta' | 'share';
  tag: string;
  tagColorClass: string;
  title: string;
  subtitle: string;
  gradientClass: string;
  icon: string;
  ariaLabel: string;
}

/**
 * Calculates remaining days from fromDate to targetDate.
 * Returns 0 if targetDate is in the past or invalid.
 */
export function calculateDaysToGo(
  targetDate: Date | string = DEFAULT_FIESTA_TARGET_DATE,
  fromDate: Date | string = new Date()
): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const from = typeof fromDate === 'string' ? new Date(fromDate) : fromDate;

  if (isNaN(target.getTime()) || isNaN(from.getTime())) {
    return 0;
  }

  const diffMs = target.getTime() - from.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Generates card configuration metadata for devotional stories.
 */
export function getStoriesConfig(params: {
  currentNovenaDay?: number;
  totalNovenaDays?: number;
  novenaTheme?: string;
  fiestaDaysToGo?: number;
} = {}): StoryCardConfig[] {
  const currentNovenaDay = params.currentNovenaDay ?? DEFAULT_NOVENA_DAY;
  const totalNovenaDays = params.totalNovenaDays ?? DEFAULT_TOTAL_NOVENA_DAYS;
  const novenaTheme = params.novenaTheme ?? DEFAULT_NOVENA_THEME;
  const fiestaDaysToGo = params.fiestaDaysToGo ?? 68;

  return [
    {
      id: 'novena',
      tag: 'Daily Novena',
      tagColorClass: 'text-amber-200',
      title: `Day ${currentNovenaDay} of ${totalNovenaDays}`,
      subtitle: novenaTheme,
      gradientClass: 'bg-gradient-to-b from-amber-500 via-red-700 to-red-900',
      icon: '📿',
      ariaLabel: `Daily Novena Day ${currentNovenaDay} of ${totalNovenaDays}, ${novenaTheme}`,
    },
    {
      id: 'gospel',
      tag: 'Sacred Word',
      tagColorClass: 'text-blue-200',
      title: 'Daily Gospel',
      subtitle: 'Luke 18:15',
      gradientClass: 'bg-gradient-to-b from-blue-500 via-indigo-700 to-slate-900',
      icon: '📖',
      ariaLabel: 'Daily Gospel, Luke 18:15',
    },
    {
      id: 'fiesta',
      tag: 'Countdown',
      tagColorClass: 'text-amber-300',
      title: 'Fiesta 2027',
      subtitle: `${fiestaDaysToGo} Days to go`,
      gradientClass: 'bg-gradient-to-b from-rose-500 via-red-800 to-purple-950',
      icon: '🎉',
      ariaLabel: `Sinulog Fiesta 2027 Countdown: ${fiestaDaysToGo} Days to go`,
    },
    {
      id: 'share',
      tag: '',
      tagColorClass: '',
      title: 'Share Reflection',
      subtitle: '',
      gradientClass: 'border-2 border-dashed border-stone-300 bg-[#FAF8F5]',
      icon: '+',
      ariaLabel: 'Share devotional reflection or prayer petition',
    },
  ];
}

export function StoriesBar({
  currentNovenaDay = DEFAULT_NOVENA_DAY,
  totalNovenaDays = DEFAULT_TOTAL_NOVENA_DAYS,
  novenaTheme = DEFAULT_NOVENA_THEME,
  fiestaCountdownDays,
  fiestaTargetDate,
  onOpenNovena,
  onOpenGospel,
  onOpenFiestaCountdown,
  onShareReflection,
}: StoriesBarProps) {
  const computedDays = calculateDaysToGo(fiestaTargetDate ?? DEFAULT_FIESTA_TARGET_DATE);
  const daysToGo = fiestaCountdownDays ?? (computedDays > 0 ? computedDays : 68);

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#EFEAE2] shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-xs font-bold uppercase tracking-wider text-stone-500 font-cinzel flex items-center gap-1.5">
          <span className="text-amber-500">✨</span>
          <span>Devotional Stories &amp; Highlights</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenNovena?.(currentNovenaDay)}
          className="text-xs font-bold text-red-800 hover:underline cursor-pointer focus:outline-none"
        >
          Novena Day {currentNovenaDay} →
        </button>
      </div>

      {/* Touch-snap horizontal stories strip */}
      <div className="flex space-x-3 overflow-x-auto pb-1 custom-scrollbar snap-x snap-mandatory">
        {/* Story 1: Daily Novena (Deep Imperial Red/Gold Gradient) */}
        <button
          type="button"
          onClick={() => onOpenNovena?.(currentNovenaDay)}
          aria-label={`Daily Novena Day ${currentNovenaDay} of ${totalNovenaDays}, ${novenaTheme}`}
          className="w-28 h-40 rounded-2xl bg-gradient-to-b from-amber-500 via-red-700 to-red-900 p-2.5 text-white flex flex-col justify-between flex-shrink-0 cursor-pointer shadow hover:shadow-lg transition transform hover:-translate-y-1 relative overflow-hidden group snap-start text-left focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-base shadow-inner">
            📿
          </div>
          <div>
            <div className="text-[9px] uppercase font-extrabold tracking-wider text-amber-200">
              Daily Novena
            </div>
            <div className="text-sm font-cinzel font-bold leading-tight">
              Day {currentNovenaDay} of {totalNovenaDays}
            </div>
            <div className="text-[10px] text-white/80 font-medium">
              {novenaTheme}
            </div>
          </div>
        </button>

        {/* Story 2: Daily Gospel (Deep Indigo/Blue Gradient) */}
        <button
          type="button"
          onClick={() => onOpenGospel?.()}
          aria-label="Daily Gospel, Luke 18:15"
          className="w-28 h-40 rounded-2xl bg-gradient-to-b from-blue-500 via-indigo-700 to-slate-900 p-2.5 text-white flex flex-col justify-between flex-shrink-0 cursor-pointer shadow hover:shadow-lg transition transform hover:-translate-y-1 snap-start text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-base shadow-inner">
            📖
          </div>
          <div>
            <div className="text-[9px] uppercase font-extrabold tracking-wider text-blue-200">
              Sacred Word
            </div>
            <div className="text-sm font-cinzel font-bold leading-tight">
              Daily Gospel
            </div>
            <div className="text-[10px] text-white/80 font-medium">
              Luke 18:15
            </div>
          </div>
        </button>

        {/* Story 3: Sinulog Fiesta 2027 Countdown (Festival Crimson/Gold) */}
        <button
          type="button"
          onClick={() => onOpenFiestaCountdown?.()}
          aria-label={`Sinulog Fiesta 2027 Countdown: ${daysToGo} Days to go`}
          className="w-28 h-40 rounded-2xl bg-gradient-to-b from-rose-500 via-red-800 to-purple-950 p-2.5 text-white flex flex-col justify-between flex-shrink-0 cursor-pointer shadow hover:shadow-lg transition transform hover:-translate-y-1 snap-start text-left focus:outline-none focus:ring-2 focus:ring-rose-400"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-base shadow-inner">
            🎉
          </div>
          <div>
            <div className="text-[9px] uppercase font-extrabold tracking-wider text-amber-300">
              Countdown
            </div>
            <div className="text-sm font-cinzel font-bold leading-tight">
              Fiesta 2027
            </div>
            <div className="text-[10px] text-white/80 font-medium">
              {daysToGo} Days to go
            </div>
          </div>
        </button>

        {/* Story 4: Share Reflection (Dashed Outline) */}
        <button
          type="button"
          onClick={() => onShareReflection?.()}
          aria-label="Share Reflection"
          className="w-28 h-40 rounded-2xl border-2 border-dashed border-stone-300 bg-[#FAF8F5] p-2.5 text-stone-500 flex flex-col justify-center items-center flex-shrink-0 cursor-pointer hover:border-red-600 hover:bg-stone-50 transition snap-start focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <div className="w-9 h-9 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-sm font-bold mb-2">
            <PlusOutlined className="text-sm" />
          </div>
          <div className="text-xs font-bold text-center text-stone-700 leading-tight">
            Share Reflection
          </div>
        </button>
      </div>
    </div>
  );
}

export default StoriesBar;
