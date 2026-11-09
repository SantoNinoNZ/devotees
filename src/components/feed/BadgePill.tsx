'use client';

import React from 'react';
import type { UserBadgeWithDefinition } from '@/types';

export interface BadgeFlair {
  id: string;
  label: string;
  icon: string;
  fullTitle: string;
  colorClass: string;
}

export function getBadgeColorClass(category?: string | null, title?: string | null): string {
  const t = (title || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (c === 'clergy' || t.includes('priest') || t.includes('clergy') || t.includes('spiritual director')) {
    return 'bg-stone-900 text-amber-200 border-stone-700 shadow-sm';
  }
  if (t.includes('hermana') || t.includes('verified')) {
    return 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm';
  }
  if (t.includes('host') || t.includes('pilgrim')) {
    return 'bg-red-50 text-red-900 border-red-200';
  }
  if (t.includes('dancer') || t.includes('sinulog dancer')) {
    return 'bg-amber-50 text-amber-900 border-amber-200';
  }
  if (c === 'performance' || t.includes('troupe') || t.includes('champion')) {
    return 'bg-purple-50 text-purple-900 border-purple-200';
  }
  if (c === 'media' || t.includes('photo') || t.includes('media')) {
    return 'bg-blue-50 text-blue-900 border-blue-200';
  }
  if (c === 'liturgy' || t.includes('novena')) {
    return 'bg-emerald-50 text-emerald-900 border-emerald-200';
  }
  if (t.includes('choir') || t.includes('music')) {
    return 'bg-rose-50 text-red-900 border-rose-200';
  }
  if (c === 'partner' || t.includes('vendor')) {
    return 'bg-purple-50 text-purple-900 border-purple-200';
  }
  return 'bg-stone-100 text-stone-800 border-stone-200';
}

export function getBadgeDefaultIcon(title: string, category?: string | null): string {
  const t = title.toLowerCase();
  const c = (category || '').toLowerCase();

  if (c === 'clergy' || t.includes('priest') || t.includes('clergy')) return '✝️';
  if (t.includes('hermana')) return '👑';
  if (t.includes('host') || t.includes('pilgrim')) return '🏠';
  if (t.includes('dancer')) return '💃';
  if (t.includes('troupe') || t.includes('champion')) return '🏆';
  if (t.includes('photo') || t.includes('media')) return '📸';
  if (t.includes('novena')) return '📿';
  if (t.includes('choir') || t.includes('music')) return '🎶';
  if (t.includes('vendor') || t.includes('food')) return '🛍️';
  return '⭐';
}

export function formatBadgeFlair(badge: UserBadgeWithDefinition): BadgeFlair {
  const def = badge.definition;
  const rawTitle = badge.title_override || def?.name || badge.badge_id || 'Devotee';
  const icon = def?.icon || getBadgeDefaultIcon(rawTitle, def?.category);
  const colorClass = getBadgeColorClass(def?.category, rawTitle);

  let label = rawTitle;
  if (badge.year && !label.includes(String(badge.year)) && !label.includes(`'${String(badge.year).slice(-2)}`)) {
    label = `${label} '${String(badge.year).slice(-2)}`;
  }

  return {
    id: badge.id || `${badge.badge_id}-${badge.year ?? ''}`,
    label,
    icon,
    fullTitle: `${rawTitle}${badge.year ? ` (${badge.year})` : ''}`,
    colorClass,
  };
}

export interface BadgePillProps {
  badge: UserBadgeWithDefinition;
  onClick?: (title: string) => void;
}

export const BadgePill: React.FC<BadgePillProps> = ({ badge, onClick }) => {
  const flair = formatBadgeFlair(badge);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(flair.fullTitle);
    } else {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(
          `Badge Verified: "${flair.fullTitle}"\n\nAwarded by Hermano Council for dedicated service to the Santo Niño community.`
        );
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={flair.fullTitle}
      className={`badge-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${flair.colorClass}`}
    >
      <span>{flair.icon}</span>
      <span>{flair.label}</span>
    </button>
  );
};

export default BadgePill;
