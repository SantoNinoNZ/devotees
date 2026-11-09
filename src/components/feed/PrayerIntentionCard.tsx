'use client';

import React, { useState } from 'react';
import type { CommunityPostWithAuthor, IntentionCategory } from '@/types';
import { FeedCardHeader } from './FeedCardHeader';

export interface PrayerIntentionCardProps {
  post: CommunityPostWithAuthor;
  currentUserId?: string | null;
  onAmenToggle?: (postId: string) => Promise<void> | void;
  onCommentClick?: (postId: string) => void;
  onShareClick?: (post: CommunityPostWithAuthor) => void;
  onBadgeClick?: (badgeName: string) => void;
  onDeletePost?: (postId: string) => void;
  className?: string;
}

export interface IntentionCategoryConfig {
  label: string;
  className: string;
}

/**
 * Maps database intention_category to friendly devotional label and styling tokens.
 */
export function getIntentionCategoryBadge(
  category?: IntentionCategory | string | null
): IntentionCategoryConfig {
  switch (category) {
    case 'healing':
      return {
        label: '🙏 Healing Intention',
        className: 'bg-red-50 text-red-800 border-red-200',
      };
    case 'thanksgiving':
      return {
        label: '🎉 Thanksgiving',
        className: 'bg-amber-50 text-amber-900 border-amber-200',
      };
    case 'repose':
      return {
        label: '🕊️ Eternal Repose',
        className: 'bg-stone-100 text-stone-800 border-stone-200',
      };
    case 'special':
      return {
        label: '✨ Special Intention',
        className: 'bg-purple-50 text-purple-900 border-purple-200',
      };
    default:
      return {
        label: '🙏 Prayer Request',
        className: 'bg-red-50 text-red-800 border-red-200',
      };
  }
}

export const PrayerIntentionCard: React.FC<PrayerIntentionCardProps> = ({
  post,
  currentUserId,
  onAmenToggle,
  onCommentClick,
  onShareClick,
  onBadgeClick,
  onDeletePost,
  className = '',
}) => {
  const initialAmenCount =
    post.reaction_counts?.amen ??
    (post.reactions ? post.reactions.filter((r) => r.reaction_type === 'amen').length : 0);
  const initialIsPrayed = post.user_reaction === 'amen';

  const [isPrayed, setIsPrayed] = useState<boolean>(initialIsPrayed);
  const [amenCount, setAmenCount] = useState<number>(initialAmenCount);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const categoryBadge = getIntentionCategoryBadge(post.intention_category);
  const commentsCount = post.comments_count ?? 0;

  const handleAmen = async () => {
    if (isSubmitting) return;

    const nextIsPrayed = !isPrayed;
    const nextCount = nextIsPrayed ? amenCount + 1 : Math.max(0, amenCount - 1);

    setIsPrayed(nextIsPrayed);
    setAmenCount(nextCount);

    if (onAmenToggle) {
      try {
        setIsSubmitting(true);
        await onAmenToggle(post.id);
      } catch (err) {
        // Revert on error
        console.error('Failed to toggle Amen:', err);
        setIsPrayed(!nextIsPrayed);
        setAmenCount(amenCount);
      } finally {
        setIsSubmitting(false);
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
          title: 'Santo Niño Prayer Intention',
          text: post.content,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        });
      } catch {
        // User cancelled share or not supported
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `Prayer Intention on Santo Niño Devotees:\n"${post.content}"`
        );
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('Prayer intention link copied to clipboard!');
        }
      } catch {
        // clipboard access denied
      }
    }
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-[#EFEAE2] shadow-sm hover:shadow-md transition overflow-hidden ${className}`}
      data-testid={`prayer-intention-card-${post.id}`}
    >
      {/* Post Author Header */}
      <FeedCardHeader
        author={post.author}
        createdAt={post.created_at}
        rightSlot={
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${categoryBadge.className}`}
          >
            {categoryBadge.label}
          </span>
        }
        canDelete={Boolean(currentUserId && (post.author_id === currentUserId || post.author?.id === currentUserId))}
        onDelete={() => onDeletePost?.(post.id)}
        onBadgeClick={onBadgeClick}
      />

      {/* Post Body */}
      <div className="px-4 pb-3.5 text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-line">
        {post.content}
      </div>

      {/* Liturgical Saturday Mass Counter Bar */}
      <div className="mx-4 mb-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🙏</span>
          <span className="font-bold text-sm" data-testid="prayer-count">
            {amenCount} {amenCount === 1 ? 'Devotee joined in prayer' : 'Devotees joined in prayer'}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full self-start sm:self-auto">
          ✓ Included in Saturday Mass Intentions
        </span>
      </div>

      {/* Action Bar: Amen, Comment, Share */}
      <div className="border-t border-stone-100 px-3 py-2 flex justify-around text-xs sm:text-sm font-bold text-stone-600">
        <button
          type="button"
          onClick={handleAmen}
          disabled={isSubmitting}
          data-testid="amen-button"
          className={`flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition cursor-pointer ${
            isPrayed ? 'text-red-700 font-extrabold bg-red-50/40' : 'text-stone-700'
          }`}
          aria-label={isPrayed ? 'You prayed for this intention' : 'Say Amen / Pray for this intention'}
        >
          <span className="text-base">🙏</span>
          <span>{isPrayed ? '✓ You Prayed' : 'Amen / Pray'}</span>
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
          aria-label="Share this prayer intention"
        >
          <span className="text-base text-stone-400">↗</span>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
};

export default PrayerIntentionCard;
