'use client';

import React, { useState } from 'react';
import type { CommunityPostWithAuthor, PostReactionType } from '@/types';
import { extractYouTubeVideoId } from '@/utils/media';
import { FeedCardHeader } from './FeedCardHeader';
import { PrayerIntentionCard } from './PrayerIntentionCard';
import { YouTubeVideoCard } from './YouTubeVideoCard';
import { EventAnnouncementCard } from './EventAnnouncementCard';

export type FeedCardDisplayType = 'prayer' | 'youtube' | 'event' | 'general';

/**
 * Dispatches a post to the appropriate specialized card type.
 */
export function getPostDisplayType(post: CommunityPostWithAuthor): FeedCardDisplayType {
  // Prayer intentions take precedence if explicitly categorized or marked as prayer request
  if (post.post_type === 'prayer_request' || Boolean(post.intention_category)) {
    return 'prayer';
  }

  // Events take precedence if marked as event or carrying liturgical roster/event data
  if (post.post_type === 'event' || Boolean(post.event) || Boolean(post.event_id)) {
    return 'event';
  }

  // YouTube videos take precedence if a video ID or recognized YouTube media URL exists
  if (
    post.youtube_video_id ||
    (Array.isArray(post.media_urls) && post.media_urls.some((url) => extractYouTubeVideoId(url)))
  ) {
    return 'youtube';
  }

  return 'general';
}

/**
 * Standard General Update Card for announcements, reflections, and photo posts.
 */
export const GeneralPostCard: React.FC<{
  post: CommunityPostWithAuthor;
  currentUserId?: string | null;
  onReactionToggle?: (postId: string, reactionType: PostReactionType) => Promise<void> | void;
  onCommentClick?: (postId: string) => void;
  onShareClick?: (post: CommunityPostWithAuthor) => void;
  onBadgeClick?: (badgeName: string) => void;
  onDeletePost?: (postId: string) => void;
  className?: string;
}> = ({
  post,
  currentUserId,
  onReactionToggle,
  onCommentClick,
  onShareClick,
  onBadgeClick,
  onDeletePost,
  className = '',
}) => {
  const initialLikeCount =
    post.reaction_counts?.like ??
    (post.reactions ? post.reactions.filter((r) => r.reaction_type === 'like').length : 0);
  const initialIsLiked = post.user_reaction === 'like';

  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);

  const commentsCount = post.comments_count ?? 0;
  const imageMedia = (post.media_urls || []).filter((url) => !extractYouTubeVideoId(url));

  const handleLike = async () => {
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikeCount(nextIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1));

    if (onReactionToggle) {
      try {
        await onReactionToggle(post.id, 'like');
      } catch (err) {
        console.error('Failed to toggle like reaction:', err);
        setIsLiked(!nextIsLiked);
        setLikeCount(likeCount);
      }
    }
  };

  const handleShare = () => {
    if (onShareClick) {
      onShareClick(post);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(post.content);
    }
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-[#EFEAE2] shadow-sm hover:shadow-md transition overflow-hidden ${className}`}
      data-testid={`general-post-card-${post.id}`}
    >
      <FeedCardHeader
        author={post.author}
        createdAt={post.created_at}
        onBadgeClick={onBadgeClick}
        canDelete={Boolean(currentUserId && (post.author_id === currentUserId || post.author?.id === currentUserId))}
        onDelete={() => onDeletePost?.(post.id)}
      />

      {post.content && (
        <div className="px-4 pb-3 text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-line">
          {post.content}
        </div>
      )}

      {imageMedia.length > 0 && (
        <div className="px-4 pb-3">
          <div
            className={`grid gap-2 rounded-xl overflow-hidden ${
              imageMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {imageMedia.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Post attachment ${i + 1}`}
                className="w-full h-48 object-cover rounded-lg bg-stone-100"
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="border-t border-stone-100 px-3 py-2 flex justify-around text-xs sm:text-sm font-bold text-stone-600">
        <button
          type="button"
          onClick={handleLike}
          className={`flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition cursor-pointer ${
            isLiked ? 'text-red-700 font-extrabold bg-rose-50/50' : 'text-stone-700'
          }`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>Like {likeCount > 0 ? `(${likeCount})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => onCommentClick?.(post.id)}
          className="flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition text-stone-600 cursor-pointer"
        >
          <span className="text-base text-stone-400">💬</span>
          <span>Comment {commentsCount > 0 ? `(${commentsCount})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition text-stone-600 cursor-pointer"
        >
          <span className="text-base text-stone-400">↗</span>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
};

export interface CommunityFeedProps {
  posts: CommunityPostWithAuthor[];
  isLoading?: boolean;
  currentUserId?: string | null;
  onAmenToggle?: (postId: string) => Promise<void> | void;
  onReactionToggle?: (postId: string, reactionType: PostReactionType) => Promise<void> | void;
  onRsvpToggle?: (eventId: string, currentStatus: boolean) => Promise<void> | void;
  onOpenChoirSchedule?: (eventId: string) => void;
  onCommentClick?: (postId: string) => void;
  onShareClick?: (post: CommunityPostWithAuthor) => void;
  onBadgeClick?: (badgeName: string) => void;
  onDeletePost?: (postId: string) => void;
  emptyMessage?: string;
  className?: string;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  isLoading = false,
  currentUserId,
  onAmenToggle,
  onReactionToggle,
  onRsvpToggle,
  onOpenChoirSchedule,
  onCommentClick,
  onShareClick,
  onBadgeClick,
  onDeletePost,
  emptyMessage,
  className = '',
}) => {
  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="community-feed-loading">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-[#EFEAE2] p-4 shadow-sm animate-pulse space-y-3"
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-200 rounded w-1/3" />
                <div className="h-3 bg-stone-100 rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-stone-200 rounded w-full" />
              <div className="h-4 bg-stone-200 rounded w-5/6" />
              <div className="h-4 bg-stone-100 rounded w-3/4" />
            </div>
            <div className="pt-2 h-10 bg-stone-50 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Empty State Handling
  if (!posts || posts.length === 0) {
    return (
      <div
        className={`bg-white rounded-2xl border border-[#EFEAE2] p-8 sm:p-12 text-center shadow-sm ${className}`}
        data-testid="community-feed-empty"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-800 flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm">
          🕊️
        </div>
        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-cinzel">
          No Community Posts Yet
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
          {emptyMessage ||
            'Be the first to share a prayer intention, novena reflection, or Sinulog highlight with the devotees! Viva Pit Señor!'}
        </p>
      </div>
    );
  }

  // 3. Render Post Cards Dispatched by Type
  return (
    <div className={`space-y-4 ${className}`} data-testid="community-feed">
      {posts.map((post) => {
        const displayType = getPostDisplayType(post);

        switch (displayType) {
          case 'prayer':
            return (
              <PrayerIntentionCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onAmenToggle={onAmenToggle}
                onCommentClick={onCommentClick}
                onShareClick={onShareClick}
                onBadgeClick={onBadgeClick}
                onDeletePost={onDeletePost}
              />
            );

          case 'youtube':
            return (
              <YouTubeVideoCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onReactionToggle={onReactionToggle}
                onCommentClick={onCommentClick}
                onShareClick={onShareClick}
                onBadgeClick={onBadgeClick}
                onDeletePost={onDeletePost}
              />
            );

          case 'event':
            return (
              <EventAnnouncementCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onRsvpToggle={onRsvpToggle}
                onOpenChoirSchedule={onOpenChoirSchedule}
                onReactionToggle={onReactionToggle}
                onCommentClick={onCommentClick}
                onShareClick={onShareClick}
                onBadgeClick={onBadgeClick}
              />
            );

          case 'general':
          default:
            return (
              <GeneralPostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onReactionToggle={onReactionToggle}
                onCommentClick={onCommentClick}
                onShareClick={onShareClick}
                onBadgeClick={onBadgeClick}
                onDeletePost={onDeletePost}
              />
            );
        }
      })}
    </div>
  );
};

export default CommunityFeed;
