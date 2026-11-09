'use client';

import React, { useState } from 'react';
import type { CommunityPostWithAuthor, PostReactionType } from '@/types';
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from '@/utils/media';
import { FeedCardHeader } from './FeedCardHeader';

export interface YouTubeVideoCardProps {
  post: CommunityPostWithAuthor;
  currentUserId?: string | null;
  onReactionToggle?: (postId: string, reactionType: PostReactionType) => Promise<void> | void;
  onCommentClick?: (postId: string) => void;
  onShareClick?: (post: CommunityPostWithAuthor) => void;
  onBadgeClick?: (badgeName: string) => void;
  className?: string;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({
  post,
  onReactionToggle,
  onCommentClick,
  onShareClick,
  onBadgeClick,
  className = '',
}) => {
  // Resolve YouTube Video ID from dedicated field or media_urls
  const videoId =
    post.youtube_video_id ||
    (Array.isArray(post.media_urls)
      ? post.media_urls.map(extractYouTubeVideoId).find(Boolean) || null
      : null);

  const initialHeartCount =
    post.reaction_counts?.heart ??
    (post.reactions ? post.reactions.filter((r) => r.reaction_type === 'heart').length : 0);
  const initialIsHearted = post.user_reaction === 'heart';

  const [isHearted, setIsHearted] = useState<boolean>(initialIsHearted);
  const [heartCount, setHeartCount] = useState<number>(initialHeartCount);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const commentsCount = post.comments_count ?? 0;
  const embedUrl = videoId ? getYouTubeEmbedUrl(videoId) : '';
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '#';

  const handleHeart = async () => {
    if (isSubmitting) return;

    const nextIsHearted = !isHearted;
    const nextCount = nextIsHearted ? heartCount + 1 : Math.max(0, heartCount - 1);

    setIsHearted(nextIsHearted);
    setHeartCount(nextCount);

    if (onReactionToggle) {
      try {
        setIsSubmitting(true);
        await onReactionToggle(post.id, 'heart');
      } catch (err) {
        console.error('Failed to toggle heart reaction:', err);
        setIsHearted(!nextIsHearted);
        setHeartCount(heartCount);
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
          title: 'Santo Niño Community Video',
          text: post.content,
          url: watchUrl !== '#' ? watchUrl : (typeof window !== 'undefined' ? window.location.href : undefined),
        });
      } catch {
        // cancelled
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `Santo Niño Community Video:\n${watchUrl !== '#' ? watchUrl : post.content}`
        );
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('Video link copied to clipboard!');
        }
      } catch {
        // clipboard access denied
      }
    }
  };

  return (
    <article
      className={`bg-white rounded-2xl border border-[#EFEAE2] shadow-sm hover:shadow-md transition overflow-hidden ${className}`}
      data-testid={`youtube-video-card-${post.id}`}
    >
      {/* Post Author Header */}
      <FeedCardHeader
        author={post.author}
        createdAt={post.created_at}
        rightSlot={
          <span className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 text-sm">
            ⋯
          </span>
        }
        onBadgeClick={onBadgeClick}
      />

      {/* Post Body */}
      {post.content && (
        <div className="px-4 pb-3 text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-line">
          {post.content}
        </div>
      )}

      {/* 16:9 Responsive Video Embed (Zero Supabase Storage) */}
      {embedUrl ? (
        <div className="px-4 pb-3">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm bg-black">
            <iframe
              src={embedUrl}
              title={post.content ? post.content.slice(0, 50) : 'Santo Niño Devotion Video'}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="youtube-iframe"
            />
          </div>
          <div className="text-[11px] text-stone-400 mt-1.5 flex justify-between font-medium items-center">
            <span>Free YouTube Stream (0 storage cost)</span>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
              data-testid="youtube-external-link"
            >
              <span>Open on YouTube</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <div className="p-4 rounded-xl bg-stone-100 text-stone-500 text-xs text-center">
            Video link unavailable
          </div>
        </div>
      )}

      {/* Action Bar: Care/Heart, Comment, Share */}
      <div className="border-t border-stone-100 px-3 py-2 flex justify-around text-xs sm:text-sm font-bold text-stone-600">
        <button
          type="button"
          onClick={handleHeart}
          disabled={isSubmitting}
          data-testid="care-button"
          className={`flex-1 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-center space-x-1.5 transition cursor-pointer ${
            isHearted ? 'text-red-700 font-extrabold bg-rose-50/50' : 'text-stone-700'
          }`}
          aria-label={isHearted ? `Hearted (${heartCount})` : `Care (${heartCount})`}
        >
          <span>{isHearted ? '❤️' : '🤍'}</span>
          <span>Care {heartCount > 0 ? `(${heartCount})` : ''}</span>
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
          aria-label="Share video"
        >
          <span className="text-base text-stone-400">↗</span>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
};

export default YouTubeVideoCard;
