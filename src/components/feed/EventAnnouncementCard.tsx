'use client';

import React, { useState } from 'react';
import type { CommunityPostWithAuthor, PostReactionType } from '@/types';
import { FeedCardHeader } from './FeedCardHeader';

export interface EventAnnouncementCardProps {
  post: CommunityPostWithAuthor;
  currentUserId?: string | null;
  isRsvpGoing?: boolean;
  attendeeCount?: number;
  carpoolCount?: number;
  onRsvpToggle?: (eventId: string, currentStatus: boolean) => Promise<void> | void;
  onOpenChoirSchedule?: (eventId: string) => void;
  onReactionToggle?: (postId: string, reactionType: PostReactionType) => Promise<void> | void;
  onCommentClick?: (postId: string) => void;
  onShareClick?: (post: CommunityPostWithAuthor) => void;
  onBadgeClick?: (badgeName: string) => void;
  className?: string;
}

/**
 * Generates 1-tap Google Maps query URL.
 */
export function getGoogleMapsUrl(query: string): string {
  if (!query || !query.trim()) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

/**
 * Extracts month abbreviation and day number for the Cinzel date badge.
 * Handles ISO strings and date formats safely, preserving calendar date.
 */
export function formatEventDateBadge(dateString?: string | null): { month: string; day: string } {
  if (!dateString) return { month: 'TBD', day: '--' };

  // Parse YYYY-MM-DD directly if available to prevent cross-timezone date shifting
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, , monthStr, dayStr] = match;
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return {
        month: MONTH_NAMES[monthIndex],
        day: String(parseInt(dayStr, 10)),
      };
    }
  }

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { month: 'TBD', day: '--' };

  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate());
  return { month, day };
}

export const EventAnnouncementCard: React.FC<EventAnnouncementCardProps> = ({
  post,
  isRsvpGoing = true,
  attendeeCount = 38,
  carpoolCount = 14,
  onRsvpToggle,
  onOpenChoirSchedule,
  onReactionToggle,
  onCommentClick,
  onShareClick,
  onBadgeClick,
  className = '',
}) => {
  const event = post.event;
  const eventId = event?.id || post.event_id || post.id;

  const [isGoing, setIsGoing] = useState<boolean>(isRsvpGoing);
  const [currentAttendees, setCurrentAttendees] = useState<number>(attendeeCount);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState<boolean>(false);

  // Date and Time
  const eventDateString = event?.event_start_date || event?.start_date || post.created_at;
  const { month, day } = formatEventDateBadge(eventDateString);
  const eventTime = event?.event_start_time || event?.time || '5:30 PM';
  const eventTitle = event?.title || 'Saturday Novena Mass & Blessing of Images';
  const venue = event?.venue || "St Benedict's Church";
  const address = event?.address || '1 St Benedicts St, Eden Terrace, Auckland';
  const fullVenueQuery = [venue, address].filter(Boolean).join(', ');
  const mapsUrl = getGoogleMapsUrl(fullVenueQuery);

  // Liturgical Roster Details
  const choirName = event?.choir_name || null;
  const presiderName = event?.presider_name || null;
  const lectors = Array.isArray(event?.lectors)
    ? event.lectors.join(', ')
    : typeof event?.lectors === 'string'
    ? event.lectors
    : null;
  const sponsorChapter = event?.sponsor_chapter || null;

  const hasLiturgicalRoster = Boolean(choirName || presiderName || lectors || sponsorChapter);

  const commentsCount = post.comments_count ?? 0;
  const initialLikeCount =
    post.reaction_counts?.total ??
    (post.reactions ? post.reactions.length : 0);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [isLiked, setIsLiked] = useState<boolean>(Boolean(post.user_reaction));

  const handleRsvpToggle = async () => {
    if (isSubmittingRsvp) return;

    const nextStatus = !isGoing;
    setIsGoing(nextStatus);
    setCurrentAttendees(nextStatus ? currentAttendees + 1 : Math.max(0, currentAttendees - 1));

    if (onRsvpToggle) {
      try {
        setIsSubmittingRsvp(true);
        await onRsvpToggle(eventId, nextStatus);
      } catch (err) {
        console.error('Failed to toggle RSVP:', err);
        setIsGoing(!nextStatus);
        setCurrentAttendees(currentAttendees);
      } finally {
        setIsSubmittingRsvp(false);
      }
    }
  };

  const handleLike = async () => {
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikeCount(nextIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1));

    if (onReactionToggle) {
      try {
        await onReactionToggle(post.id, 'like');
      } catch (err) {
        console.error('Failed to toggle reaction:', err);
        setIsLiked(!nextIsLiked);
        setLikeCount(likeCount);
      }
    }
  };

  const handleShare = async () => {
    if (onShareClick) {
      onShareClick(post);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `${eventTitle}\n${eventTime} • ${venue}\n${post.content || ''}`,
          url: mapsUrl,
        });
      } catch {
        // cancelled
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${eventTitle}\n${eventTime} • ${fullVenueQuery}\nDirections: ${mapsUrl}`
        );
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('Event invitation link and directions copied to clipboard!');
        }
      } catch {
        // clipboard access denied
      }
    }
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-[#EFEAE2] shadow-sm hover:shadow-md transition overflow-hidden ${className}`}
      data-testid={`event-announcement-card-${post.id}`}
    >
      {/* Post Author Header */}
      <FeedCardHeader
        author={post.author}
        createdAt={post.created_at}
        rightSlot={
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
            📅 Novena Mass
          </span>
        }
        onBadgeClick={onBadgeClick}
      />

      {/* Post Text Content */}
      {post.content && (
        <div className="px-4 pb-3.5 text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-line">
          {post.content}
        </div>
      )}

      {/* Event Box with Liturgical Roster & Map Directions */}
      <div className="mx-4 mb-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEAE2] p-4 space-y-3.5">
        {/* Top Row: Date Badge, Title, Venue & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-xl bg-red-800 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm"
              data-testid="event-date-badge"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
                {month}
              </span>
              <span className="text-xl font-bold leading-none font-cinzel">{day}</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-stone-900 font-cinzel truncate">
                {eventTitle}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 truncate">
                {eventTime} • {venue}
              </div>
              <div className="text-xs text-emerald-800 font-bold mt-1">
                ✓ {currentAttendees} Devotees Attending
                {carpoolCount > 0 ? ` • ${carpoolCount} Carpooling` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
              title="Get GPS Directions"
              data-testid="map-link"
              aria-label={`Get directions to ${venue}`}
            >
              <span className="text-red-700">📍</span>
              <span>Map</span>
            </a>

            <button
              type="button"
              onClick={handleRsvpToggle}
              disabled={isSubmittingRsvp}
              data-testid="rsvp-button"
              className={`font-bold text-xs px-4 py-2.5 rounded-xl transition flex-shrink-0 cursor-pointer ${
                isGoing
                  ? 'bg-red-800 hover:bg-red-900 text-white shadow'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
              aria-label={isGoing ? 'Cancel RSVP Going' : 'RSVP Going'}
            >
              {isGoing ? '✓ RSVP Going' : '+ RSVP Going'}
            </button>
          </div>
        </div>

        {/* LITURGICAL MINISTRY ROSTER & CHOIR ROTATION HIGHLIGHT */}
        {hasLiturgicalRoster && (
          <div
            className="pt-3 border-t border-stone-200/80 space-y-2"
            data-testid="liturgical-roster-box"
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-cinzel flex items-center gap-1.5">
                <span>🕊️</span>
                <span>Liturgical Ministry & Choir Roster</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChoirSchedule?.(eventId)}
                data-testid="view-schedule-button"
                className="text-[11px] font-bold text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Schedule</span>
                <span className="text-[10px]">→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {choirName && (
                <div
                  className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-2xs min-w-0"
                  data-testid="roster-choir"
                >
                  <span className="text-base flex-shrink-0">🎶</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-stone-400">
                      Music Ministry
                    </div>
                    <div className="font-bold text-stone-900 truncate">{choirName}</div>
                  </div>
                </div>
              )}

              {presiderName && (
                <div
                  className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-2xs min-w-0"
                  data-testid="roster-presider"
                >
                  <span className="text-base flex-shrink-0">✝️</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-stone-400">
                      Presiding Priest
                    </div>
                    <div className="font-bold text-stone-900 truncate">{presiderName}</div>
                  </div>
                </div>
              )}

              {lectors && (
                <div
                  className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-2xs min-w-0"
                  data-testid="roster-lectors"
                >
                  <span className="text-base flex-shrink-0">📖</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-stone-400">
                      Lector & Readings
                    </div>
                    <div className="font-bold text-stone-900 truncate">{lectors}</div>
                  </div>
                </div>
              )}

              {sponsorChapter && (
                <div
                  className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-2xs min-w-0"
                  data-testid="roster-sponsor"
                >
                  <span className="text-base flex-shrink-0">🤝</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-stone-400">
                      Mass Sponsor
                    </div>
                    <div className="font-bold text-stone-900 truncate">{sponsorChapter}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t border-stone-100 px-3 py-2 flex justify-around text-xs sm:text-sm font-bold text-stone-600">
        <button
          type="button"
          onClick={handleLike}
          data-testid="like-button"
          className={`flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition cursor-pointer ${
            isLiked ? 'text-red-700 font-extrabold bg-rose-50/50' : 'text-stone-700'
          }`}
          aria-label={isLiked ? `Liked (${likeCount})` : `Like (${likeCount})`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>Like {likeCount > 0 ? `(${likeCount})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => onCommentClick?.(post.id)}
          data-testid="comment-button"
          className="flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition text-stone-600 cursor-pointer"
          aria-label={`Comments (${commentsCount})`}
        >
          <span className="text-base text-stone-400">💬</span>
          <span>Comment {commentsCount > 0 ? `(${commentsCount})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          data-testid="share-button"
          className="flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition text-stone-600 cursor-pointer"
          aria-label="Share event"
        >
          <span className="text-base text-stone-400">↗</span>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
};

export default EventAnnouncementCard;
