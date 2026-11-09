'use client';

import React, { useState, useEffect } from 'react';
import type { ProfileWithRoles, UserBadgeWithDefinition } from '@/types';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type BadgeColorScheme = 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'stone';

export interface DefaultBadgeItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  colorScheme: BadgeColorScheme | string;
  colSpan?: number;
  category?: string | null;
  description?: string | null;
  organization?: string | null;
  year?: number | null;
  isVerified?: boolean;
  rawBadge?: UserBadgeWithDefinition;
}

export interface HonorRibbonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: ProfileWithRoles | null;
  userBadges?: UserBadgeWithDefinition[];
  onBadgeClick?: (badge: UserBadgeWithDefinition | DefaultBadgeItem) => void;
}

// ==========================================
// DEFAULT SAMPLE BADGE PRESETS
// ==========================================

export const DEFAULT_HONOR_RIBBONS: DefaultBadgeItem[] = [
  {
    id: 'preset-sinulog-dancer',
    title: 'Sinulog Dancer',
    subtitle: "'24, '25, '26 (3 yrs)",
    icon: '💃',
    colorScheme: 'amber',
    category: 'performance',
    description: 'Sinulog Dancer (2024, 2025, 2026)',
    organization: 'Sinulog Auckland Dance Troupe',
    isVerified: true,
  },
  {
    id: 'preset-photographer',
    title: 'Photographer',
    subtitle: "Official Media '25",
    icon: '📸',
    colorScheme: 'blue',
    category: 'media',
    description: 'Official Festival Photographer 2025',
    organization: 'NZ Media Guild',
    isVerified: true,
  },
  {
    id: 'preset-novena-streak',
    title: 'Novena Streak',
    subtitle: "9 Days Done '26",
    icon: '📿',
    colorScheme: 'emerald',
    category: 'liturgy',
    description: '9-Day Novena Completer 2026',
    organization: 'Hermano Council',
    isVerified: true,
  },
  {
    id: 'preset-festival-vendor',
    title: 'Festival Vendor',
    subtitle: "Food Partner '26 (Kanto Grill NZ)",
    icon: '🛍️',
    colorScheme: 'purple',
    category: 'partner',
    description: 'Official Festival Vendor: Kanto Grill NZ',
    organization: 'Kanto Grill NZ',
    isVerified: true,
  },
  {
    id: 'preset-choir-member',
    title: 'Music Ministry Choir Member',
    subtitle: "Coro de Santo Niño ('24, '25, '26 Rotation)",
    icon: '🎶',
    colorScheme: 'rose',
    colSpan: 2,
    category: 'music',
    description: 'Choir Member: Coro de Santo Niño (Tenor / 3 Years)',
    organization: 'Coro de Santo Niño',
    isVerified: true,
  },
];

// ==========================================
// COLOR STYLES
// ==========================================

export const BADGE_COLOR_STYLES: Record<
  BadgeColorScheme,
  {
    border: string;
    hoverBorder: string;
    iconBg: string;
    subtitleText: string;
    badgeBg: string;
  }
> = {
  amber: {
    border: 'border-amber-200',
    hoverBorder: 'hover:border-gold-500',
    iconBg: 'bg-amber-100 text-amber-800',
    subtitleText: 'text-gold-700',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  blue: {
    border: 'border-blue-200',
    hoverBorder: 'hover:border-blue-500',
    iconBg: 'bg-blue-100 text-blue-800',
    subtitleText: 'text-blue-700',
    badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  emerald: {
    border: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-800',
    subtitleText: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
  purple: {
    border: 'border-purple-200',
    hoverBorder: 'hover:border-purple-500',
    iconBg: 'bg-purple-100 text-purple-800',
    subtitleText: 'text-purple-700',
    badgeBg: 'bg-purple-50 text-purple-900 border-purple-200',
  },
  rose: {
    border: 'border-rose-200',
    hoverBorder: 'hover:border-brand-600',
    iconBg: 'bg-rose-100 text-brand-800',
    subtitleText: 'text-brand-800',
    badgeBg: 'bg-rose-50 text-red-900 border-rose-200',
  },
  stone: {
    border: 'border-stone-200',
    hoverBorder: 'hover:border-stone-400',
    iconBg: 'bg-stone-100 text-stone-700',
    subtitleText: 'text-stone-600',
    badgeBg: 'bg-stone-50 text-stone-700 border-stone-200',
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function getBadgeDefaultIcon(title: string, category?: string | null): string {
  const t = title.toLowerCase();
  const c = (category || '').toLowerCase();

  if (c === 'clergy' || t.includes('priest') || t.includes('clergy')) return '✝️';
  if (t.includes('hermana') || t.includes('verified')) return '👑';
  if (t.includes('host') || t.includes('pilgrim')) return '🏠';
  if (t.includes('dancer') || c === 'dance') return '💃';
  if (t.includes('troupe') || t.includes('champion')) return '🏆';
  if (t.includes('photo') || t.includes('media') || c === 'media') return '📸';
  if (t.includes('novena') || c === 'liturgy') return '📿';
  if (t.includes('choir') || t.includes('music') || c === 'music') return '🎶';
  if (t.includes('vendor') || t.includes('food') || c === 'partner') return '🛍️';
  return '🎖️';
}

export function resolveBadgeColorScheme(
  badge: {
    colorScheme?: string | null;
    category?: string | null;
    title?: string | null;
    title_override?: string | null;
    badge_id?: string | null;
    definition?: { category?: string | null; badge_color?: string | null; name?: string | null } | null;
  }
): BadgeColorScheme {
  if (badge.colorScheme) {
    const cs = badge.colorScheme.toLowerCase();
    if (['amber', 'blue', 'emerald', 'purple', 'rose', 'stone'].includes(cs)) {
      return cs as BadgeColorScheme;
    }
  }

  const def = badge.definition;
  if (def?.badge_color) {
    const bc = def.badge_color.toLowerCase();
    for (const c of ['amber', 'blue', 'emerald', 'purple', 'rose', 'stone']) {
      if (bc.includes(c)) return c as BadgeColorScheme;
    }
  }

  const category = (def?.category || badge.category || '').toLowerCase();
  const title = (badge.title || badge.title_override || def?.name || badge.badge_id || '').toLowerCase();

  if (category === 'media' || title.includes('photo') || title.includes('media')) {
    return 'blue';
  }
  if (category === 'liturgy' || title.includes('novena') || title.includes('prayer')) {
    return 'emerald';
  }
  if (category === 'partner' || title.includes('vendor') || title.includes('food') || title.includes('troupe') || title.includes('champion')) {
    return 'purple';
  }
  if (category === 'music' || title.includes('choir') || title.includes('music') || title.includes('coro')) {
    return 'rose';
  }
  if (category === 'clergy' || title.includes('priest') || title.includes('hermana') || title.includes('dancer')) {
    return 'amber';
  }

  return 'amber';
}

export function transformUserBadgeToItem(badge: UserBadgeWithDefinition): DefaultBadgeItem {
  const def = badge.definition;
  const title = badge.title_override || def?.name || badge.badge_id || 'Honor Badge';
  const icon = def?.icon || getBadgeDefaultIcon(title, def?.category);
  const colorScheme = resolveBadgeColorScheme(badge);

  let subtitle = '';
  if (badge.organization_or_troupe) {
    subtitle = badge.year
      ? `${badge.organization_or_troupe} ('${String(badge.year).slice(-2)})`
      : badge.organization_or_troupe;
  } else if (badge.year) {
    subtitle = `Verified '${String(badge.year).slice(-2)}`;
  } else {
    subtitle = def?.category ? `${def.category.toUpperCase()} Award` : 'Verified Devotee';
  }

  const isLong = title.length > 20 || (badge.organization_or_troupe && badge.organization_or_troupe.length > 25);
  const colSpan = isLong ? 2 : 1;

  return {
    id: badge.id || `badge-${badge.badge_id}-${badge.year ?? ''}`,
    title,
    subtitle,
    icon,
    colorScheme,
    colSpan,
    category: def?.category,
    description: def?.description || undefined,
    organization: badge.organization_or_troupe || undefined,
    year: badge.year || undefined,
    isVerified: true,
    rawBadge: badge,
  };
}

export function resolveModalBadges(
  userBadges?: UserBadgeWithDefinition[] | null,
  profile?: ProfileWithRoles | null
): DefaultBadgeItem[] {
  if (userBadges && userBadges.length > 0) {
    return userBadges.map(transformUserBadgeToItem);
  }
  if (profile?.user_badges && profile.user_badges.length > 0) {
    return profile.user_badges.map(transformUserBadgeToItem);
  }
  return DEFAULT_HONOR_RIBBONS;
}

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'EM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDevoteeLocation(profile?: ProfileWithRoles | null): string {
  if (!profile) return '📍 North Shore Chapter • Joined 2024';
  const areaName = profile.area?.name
    ? profile.area.name.toLowerCase().includes('chapter')
      ? profile.area.name
      : `${profile.area.name} Chapter`
    : 'North Shore Chapter';
  const year = profile.created_at ? new Date(profile.created_at).getFullYear() : '2024';
  return `📍 ${areaName} • Joined ${year}`;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export const HonorRibbonsModal: React.FC<HonorRibbonsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  userBadges,
  onBadgeClick,
}) => {
  const [selectedBadge, setSelectedBadge] = useState<DefaultBadgeItem | null>(null);

  // Close on Escape key (dismiss detail popup first if open, else close modal)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBadge) {
          setSelectedBadge(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedBadge]);

  if (!isOpen) return null;

  const displayName = userProfile?.display_name || 'Elijah Mondero';
  const initials = getInitials(displayName);
  const locationText = formatDevoteeLocation(userProfile);
  const badgeItems = resolveModalBadges(userBadges, userProfile);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (selectedBadge) {
        setSelectedBadge(null);
      } else {
        onClose();
      }
    }
  };

  const handleCardClick = (badge: DefaultBadgeItem) => {
    setSelectedBadge(badge);
    if (onBadgeClick) {
      onBadgeClick(badge.rawBadge || badge);
    }
  };

  return (
    <>
      <div
        id="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        tabIndex={-1}
        className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
          {/* Profile Header with Cover & Avatar */}
          <div className="relative pb-3">
            <div className="h-24 rounded-2xl bg-gradient-to-r from-brand-800 via-brand-700 to-gold-600 flex items-end p-3 text-white shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-widest font-cinzel text-amber-200">
                Devotee Profile
              </span>
            </div>
            <div className="absolute -bottom-4 left-4 w-16 h-16 rounded-full bg-[#991b1b] text-white font-bold flex items-center justify-center text-xl ring-4 ring-white shadow-md overflow-hidden">
              {userProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close profile modal"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
            >
              <span className="text-sm font-bold leading-none">✕</span>
            </button>
          </div>

          {/* Devotee Details */}
          <div className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="profile-modal-title" className="font-bold text-lg text-stone-900">
                  {displayName}
                </h3>
                <div className="text-xs text-stone-500 font-medium">{locationText}</div>
              </div>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                {userProfile?.is_active === false ? 'Devotee' : 'Active Devotee'}
              </span>
            </div>
          </div>

          {/* DISCORD-STYLE "HONOR RIBBONS & FAITH BADGES" SHELF */}
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EFEAE2] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-600 font-cinzel flex items-center gap-1.5">
                <span>🎖️</span>
                <span>Honor Ribbons &amp; Roles ({badgeItems.length})</span>
              </div>
              <span className="text-[10px] text-stone-400">Verified by Coordinators</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {badgeItems.map((badge) => {
                const style =
                  BADGE_COLOR_STYLES[(badge.colorScheme as BadgeColorScheme) || 'amber'] ||
                  BADGE_COLOR_STYLES.amber;
                const colSpanClass = badge.colSpan === 2 ? 'col-span-2' : '';

                return (
                  <div
                    key={badge.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${badge.title}: ${badge.subtitle}`}
                    onClick={() => handleCardClick(badge)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(badge);
                      }
                    }}
                    className={`bg-white p-3 rounded-xl border ${style.border} shadow-sm flex items-start space-x-2.5 cursor-pointer ${style.hoverBorder} transition ${colSpanClass}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${style.iconBg} flex items-center justify-center text-lg flex-shrink-0`}
                    >
                      {badge.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-stone-900 truncate">{badge.title}</div>
                      <div className={`text-[10px] font-bold ${style.subtitleText} truncate`}>
                        {badge.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Badge Detail Popup Dialog */}
      {selectedBadge && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-detail-title"
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBadge(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl ${
                    BADGE_COLOR_STYLES[(selectedBadge.colorScheme as BadgeColorScheme) || 'amber']?.iconBg ||
                    BADGE_COLOR_STYLES.amber.iconBg
                  } flex items-center justify-center text-2xl shadow-xs`}
                >
                  {selectedBadge.icon}
                </div>
                <div>
                  <h4 id="badge-detail-title" className="font-bold text-stone-900 text-sm sm:text-base leading-tight">
                    {selectedBadge.title}
                  </h4>
                  <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider font-bold text-stone-500">
                    {selectedBadge.category ? `${selectedBadge.category} Category` : 'Faith & Service'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                aria-label="Close badge detail"
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            {selectedBadge.organization && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs">
                <span className="text-stone-500 font-medium block text-[11px] uppercase tracking-wider">
                  Affiliation / Troupe
                </span>
                <div className="font-bold text-stone-800 mt-0.5">{selectedBadge.organization}</div>
              </div>
            )}

            {selectedBadge.description && (
              <div className="text-xs text-stone-600 bg-stone-50/50 rounded-xl p-2.5 border border-stone-100">
                <p>{selectedBadge.description}</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-900">
                <span>🛡️</span>
                <span>Verified Credential</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-700">
                Awarded &amp; verified by Hermano Council for dedicated service to the Santo Niño community.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold transition shadow-sm"
              >
                Close Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
