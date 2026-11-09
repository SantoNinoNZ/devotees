'use client';

import React from 'react';
import type { ProfileWithRoles, UserBadgeWithDefinition } from '@/types';
import { BadgePill } from './BadgePill';

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'recently';

  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-NZ', {
    month: 'short',
    day: 'numeric',
  });
}

export function getAuthorInitials(name?: string | null): string {
  if (!name) return 'DN';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface FeedCardHeaderProps {
  author?: {
    id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    user_badges?: UserBadgeWithDefinition[];
    area?: { id?: string; name?: string } | null;
  } | null;
  createdAt?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  onBadgeClick?: (badgeName: string) => void;
}

export const FeedCardHeader: React.FC<FeedCardHeaderProps> = ({
  author,
  createdAt,
  subtitle,
  rightSlot,
  onBadgeClick,
}) => {
  const displayName = author?.display_name || 'Devotee';
  const initials = getAuthorInitials(displayName);
  const badges = author?.user_badges || [];

  const timeText = formatRelativeTime(createdAt);
  const resolvedSubtitle = subtitle || (author?.area?.name ? `${author.area.name} • ${timeText}` : timeText);

  const isClergy =
    displayName.toLowerCase().includes('fr.') ||
    badges.some(
      (b) =>
        b.definition?.category === 'clergy' ||
        b.badge_id?.includes('priest') ||
        (b.title_override || '').toLowerCase().includes('priest')
    );

  return (
    <div className="p-4 flex items-start justify-between gap-3">
      <div className="flex items-center space-x-3 min-w-0">
        {author?.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={displayName}
            className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-stone-100 flex-shrink-0"
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full ${
              isClergy
                ? 'bg-gradient-to-br from-amber-600 to-stone-900 text-white'
                : 'bg-gradient-to-br from-rose-200 to-rose-400 text-rose-900'
            } font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-rose-100 flex-shrink-0`}
          >
            {isClergy ? '✝️' : initials}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-stone-900 truncate">{displayName}</span>
            {badges.map((badge, idx) => (
              <BadgePill
                key={badge.id || `${badge.badge_id}-${idx}`}
                badge={badge}
                onClick={onBadgeClick}
              />
            ))}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5 font-medium truncate">
            {resolvedSubtitle}
          </div>
        </div>
      </div>

      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
  );
};

export default FeedCardHeader;
