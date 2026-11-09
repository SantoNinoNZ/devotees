'use client';

import React, { useState, useEffect, useRef } from 'react';
import type {
  CommunityPost,
  CommunityPostInsert,
  CommunityPostType,
  IntentionCategory,
  PostVisibility,
} from '@/types';
import {
  extractYouTubeVideoId,
  compressImageToWebP,
  isAllowedImageFormat,
  formatBytes,
} from '@/utils/media';
import { communityFeedApi } from '@/lib/supabase-api';
import { useAuth } from '@/hooks/useAuth';
import { getAuthorInitials } from './FeedCardHeader';

// ==========================================
// PROPS & COMPOSER INTERFACES
// ==========================================

export interface PostComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'general' | 'prayer' | 'video' | 'photo';
  onPostCreated?: (post: CommunityPost) => void;
}

export interface AttachedPhoto {
  id: string;
  dataUrl: string;
  size: number;
  originalName: string;
}

export interface IntentionCategoryOption {
  id: IntentionCategory;
  label: string;
  icon: string;
  description: string;
  badgeClass: string;
}

export interface BuildPostPayloadParams {
  authorId: string;
  content: string;
  mode?: 'general' | 'prayer' | 'video' | 'photo';
  category?: IntentionCategory | null;
  youtubeUrl?: string | null;
  mediaUrls?: string[];
  visibility?: PostVisibility;
}

export interface ValidateComposerFormInput {
  content?: string;
  youtubeUrl?: string | null;
  mediaUrls?: string[];
  photoCount?: number;
  category?: IntentionCategory | null;
}

// ==========================================
// CONSTANTS & DEVOTIONAL CONFIG
// ==========================================

export const PRAYER_INTENTION_CATEGORIES: IntentionCategoryOption[] = [
  {
    id: 'healing',
    label: 'Healing',
    icon: '🙏',
    description: 'Prayers for physical and spiritual recovery',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
  },
  {
    id: 'thanksgiving',
    label: 'Thanksgiving',
    icon: '🎉',
    description: 'Giving thanks for answered prayers and blessings',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    id: 'special',
    label: 'Special Intention',
    icon: '✨',
    description: 'Personal, family, guidance, or work supplications',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
  },
  {
    id: 'repose',
    label: 'Eternal Repose',
    icon: '🕊️',
    description: 'Prayers for the souls of departed faithful',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-200',
  },
];

// ==========================================
// PURE UTILITY & BUILDER FUNCTIONS (TESTABLE)
// ==========================================

/**
 * Returns user-facing title based on mode and active intention category.
 */
export function getComposerModalTitle(
  mode?: 'general' | 'prayer' | 'video' | 'photo',
  category?: IntentionCategory | null
): string {
  if (mode === 'video') return 'Share YouTube Video with Community';
  if (mode === 'photo') return 'Add Photos (WebP Compressed)';
  if (mode === 'prayer' || category) return 'Submit Community Prayer Intention';
  return 'Share with Community';
}

/**
 * Validates composer form inputs before submitting.
 */
export function validateComposerForm(input: ValidateComposerFormInput): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = (input.content || '').trim();
  const photoCount = input.photoCount ?? (input.mediaUrls?.length ?? 0);
  const hasPhotos = photoCount > 0;
  const hasYoutube = Boolean(input.youtubeUrl && input.youtubeUrl.trim());

  if (photoCount > 4) {
    return {
      isValid: false,
      error: 'A maximum of 4 photos is allowed.',
    };
  }

  if (hasYoutube) {
    const videoId = extractYouTubeVideoId(input.youtubeUrl!);
    if (!videoId) {
      return {
        isValid: false,
        error:
          'Please enter a valid YouTube or Shorts link (e.g., https://youtu.be/... or https://youtube.com/watch?v=...).',
      };
    }
  }

  if (!trimmed && !hasPhotos && !hasYoutube) {
    return {
      isValid: false,
      error: 'Please write a message, paste a YouTube link, or attach a photo before posting.',
    };
  }

  return { isValid: true };
}

/**
 * Builds standard CommunityPostInsert payload adhering to database schema.
 */
export function buildPostPayload(params: BuildPostPayloadParams): CommunityPostInsert {
  const content = (params.content || '').trim();
  const visibility: PostVisibility = params.visibility || 'public';
  const mediaUrls: string[] = Array.isArray(params.mediaUrls) ? params.mediaUrls : [];

  let youtubeVideoId: string | null = null;
  if (params.youtubeUrl && params.youtubeUrl.trim()) {
    youtubeVideoId = extractYouTubeVideoId(params.youtubeUrl);
  }

  // Determine post type and category
  const isPrayer = Boolean(params.category) || params.mode === 'prayer';
  const postType: CommunityPostType = isPrayer ? 'prayer_request' : 'general';
  const intentionCategory: IntentionCategory | null = isPrayer
    ? params.category || 'special'
    : null;

  return {
    author_id: params.authorId,
    content,
    post_type: postType,
    intention_category: intentionCategory,
    youtube_video_id: youtubeVideoId,
    media_urls: mediaUrls,
    visibility,
    is_pinned: false,
    is_hidden: false,
  };
}

/**
 * Helper to convert Blob into base64 Data URL.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export const PostComposerModal: React.FC<PostComposerModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'general',
  onPostCreated,
}) => {
  const { user, profile } = useAuth();

  // Form states
  const [content, setContent] = useState<string>('');
  const [mode, setMode] = useState<'general' | 'prayer' | 'video' | 'photo'>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState<IntentionCategory | null>(null);
  const [showYoutubeInput, setShowYoutubeInput] = useState<boolean>(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [showPhotoNotice, setShowPhotoNotice] = useState<boolean>(false);
  const [attachedPhotos, setAttachedPhotos] = useState<AttachedPhoto[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>('public');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setContent('');
      setYoutubeUrl('');
      setAttachedPhotos([]);
      setErrorMessage(null);
      setVisibility('public');

      if (initialMode === 'prayer') {
        setSelectedCategory('healing');
        setShowYoutubeInput(false);
        setShowPhotoNotice(false);
      } else if (initialMode === 'video') {
        setSelectedCategory(null);
        setShowYoutubeInput(true);
        setShowPhotoNotice(false);
      } else if (initialMode === 'photo') {
        setSelectedCategory(null);
        setShowYoutubeInput(false);
        setShowPhotoNotice(true);
      } else {
        setSelectedCategory(null);
        setShowYoutubeInput(false);
        setShowPhotoNotice(false);
      }
    }
  }, [isOpen, initialMode]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !isCompressing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isCompressing, onClose]);

  if (!isOpen) return null;

  // Active user info
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Devotee';
  const initials = getAuthorInitials(displayName);
  const areaName = profile?.area?.name ? `${profile.area.name} Chapter` : 'North Shore Chapter';

  // Live YouTube validation
  const extractedVideoId = youtubeUrl.trim() ? extractYouTubeVideoId(youtubeUrl) : null;
  const isYoutubeInvalid = Boolean(youtubeUrl.trim() && !extractedVideoId);

  // File Picker & WebP Compression Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const availableSlots = 4 - attachedPhotos.length;
    if (availableSlots <= 0) {
      setErrorMessage('You can upload a maximum of 4 photos per post.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    setIsCompressing(true);

    try {
      const processed: AttachedPhoto[] = [];

      for (const file of filesToProcess) {
        if (!isAllowedImageFormat(file)) {
          setErrorMessage(`"${file.name}" is not a supported format. Please use JPG, PNG, or WebP.`);
          continue;
        }

        // Compress image using browser canvas to WebP (<200KB)
        const compressedBlob = await compressImageToWebP(file, 1200, 0.75);
        const dataUrl = await blobToDataUrl(compressedBlob);

        processed.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl,
          size: compressedBlob.size,
          originalName: file.name,
        });
      }

      setAttachedPhotos((prev) => [...prev, ...processed]);
      setShowPhotoNotice(true);
    } catch (err) {
      console.error('Image compression error:', err);
      setErrorMessage('Failed to compress one or more images. Please try again.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (id: string) => {
    setAttachedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Toggle Handlers
  const handleTogglePrayer = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      if (mode === 'prayer') setMode('general');
    } else {
      setSelectedCategory('healing');
      setMode('prayer');
    }
  };

  const handleToggleYoutube = () => {
    setShowYoutubeInput((prev) => !prev);
    if (!showYoutubeInput) {
      setMode('video');
    }
  };

  const handleTogglePhoto = () => {
    setShowPhotoNotice(true);
    fileInputRef.current?.click();
  };

  // Submit Handler
  const handlePublish = async () => {
    if (isSubmitting || isCompressing) return;

    const validation = validateComposerForm({
      content,
      youtubeUrl: showYoutubeInput ? youtubeUrl : null,
      photoCount: attachedPhotos.length,
      category: selectedCategory,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Please fill in required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const authorId = profile?.id || user?.id || 'devotee-anonymous';
      const payload = buildPostPayload({
        authorId,
        content,
        mode,
        category: selectedCategory,
        youtubeUrl: showYoutubeInput ? youtubeUrl : null,
        mediaUrls: attachedPhotos.map((p) => p.dataUrl),
        visibility,
      });

      const newPost = await communityFeedApi.createPost(payload);

      onPostCreated?.(newPost);
      onClose();
    } catch (err: unknown) {
      console.error('Error creating post:', err);
      const msg = err instanceof Error ? err.message : 'Failed to publish post. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = getComposerModalTitle(mode, selectedCategory);

  return (
    <div
      id="post-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-modal-title"
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isCompressing) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3
            id="post-modal-title"
            className="font-bold text-stone-900 text-base font-cinzel flex items-center gap-2"
          >
            <span>{modalTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isCompressing}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <span className="text-base leading-none">✕</span>
          </button>
        </div>

        {/* Author & Visibility Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gold-400 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-800 text-white font-bold flex items-center justify-center text-sm ring-2 ring-gold-400 flex-shrink-0 shadow-sm">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-sm text-stone-900 truncate">{displayName}</div>
              <div className="text-xs text-stone-400 truncate">{areaName}</div>
            </div>
          </div>

          {/* Privacy Visibility Selector */}
          <div className="flex items-center">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-700 cursor-pointer"
              title="Post Visibility"
            >
              <option value="public">🌐 Public</option>
              <option value="hermanos_only">🔒 Hermanos Only</option>
            </select>
          </div>
        </div>

        {/* Prayer Intention Category Selector */}
        {(selectedCategory || mode === 'prayer') && (
          <div className="space-y-1.5 p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span className="flex items-center gap-1.5">
                <span>🙏</span>
                <span>Select Prayer Intention Category</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  if (mode === 'prayer') setMode('general');
                }}
                className="text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {PRAYER_INTENTION_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center space-x-2 p-2 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-400 text-amber-950 font-bold shadow-xs'
                        : 'bg-white/80 border-stone-200 text-stone-700 hover:bg-white'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Post Content Textarea */}
        <textarea
          id="post-content"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            selectedCategory || mode === 'prayer'
              ? 'Share your prayer petition or supplication with the devotee community...'
              : 'What reflection, prayer intention, or festival update would you like to share?'
          }
          className="w-full text-sm text-stone-800 placeholder-stone-400 focus:outline-none resize-none p-1 border-0"
        />

        {/* Video / YouTube Link Input Row */}
        {showYoutubeInput && (
          <div
            id="youtube-input-row"
            className="p-3 bg-red-50 rounded-2xl space-y-2 border border-red-200"
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="youtube-url"
                className="text-xs font-bold text-red-900 flex items-center gap-1.5"
              >
                <span className="text-red-600 text-base">▶</span>
                <span>YouTube or Shorts URL (Free Unlimited Streaming)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowYoutubeInput(false);
                  setYoutubeUrl('');
                }}
                className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              id="youtube-url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste link: https://youtube.com/watch?v=... or https://youtu.be/..."
              className="w-full text-xs bg-white border border-red-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-700"
            />

            {/* Live Video ID Validation Feedback */}
            {extractedVideoId && (
              <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <span className="font-semibold flex items-center gap-1.5 truncate">
                  <span>✓</span>
                  <span>Valid Video Detected (ID: {extractedVideoId})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setYoutubeUrl('')}
                  className="text-emerald-800 hover:underline text-[11px] font-bold ml-2 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {isYoutubeInvalid && (
              <div className="text-xs text-red-600 bg-red-100/50 px-2.5 py-1 rounded-lg">
                Please enter a recognized YouTube or YouTube Shorts URL.
              </div>
            )}
          </div>
        )}

        {/* Free Tier Image Compression Notice & Photo Thumbnails */}
        {(showPhotoNotice || attachedPhotos.length > 0) && (
          <div
            id="photo-notice-row"
            className="p-3 bg-emerald-50 rounded-2xl text-xs text-emerald-900 border border-emerald-200 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5">
                <span className="text-emerald-700">🗜️</span>
                <span>Browser WebP Compression Active</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-semibold">
                {attachedPhotos.length}/4 Photos
              </span>
            </div>
            <div className="text-stone-600 text-[11px] leading-relaxed">
              Photos are downscaled and converted to WebP (~120KB) in-browser to uphold zero-cost
              infrastructure.
            </div>

            {/* Thumbnail Previews */}
            {attachedPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {attachedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden border border-emerald-200 bg-white shadow-xs aspect-square"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.originalName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 truncate text-center">
                      {formatBytes(photo.size)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-stone-900/80 hover:bg-red-600 text-white flex items-center justify-center text-xs transition cursor-pointer"
                      title="Remove Photo"
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-2">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          data-testid="composer-photo-input"
        />

        {/* Footer & Action Controls */}
        <div className="flex justify-between items-center pt-3 border-t border-stone-100 gap-2">
          {/* Attachment Action Buttons */}
          <div className="flex space-x-1 sm:space-x-2 text-stone-500">
            <button
              type="button"
              onClick={handleTogglePhoto}
              disabled={isSubmitting || isCompressing || attachedPhotos.length >= 4}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition cursor-pointer ${
                attachedPhotos.length > 0 || showPhotoNotice
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'hover:bg-stone-100 text-emerald-700'
              } disabled:opacity-40`}
              title="Attach Compressed Photo (Max 4)"
              aria-label="Attach Photo"
            >
              <span>🖼️</span>
            </button>

            <button
              type="button"
              onClick={handleToggleYoutube}
              disabled={isSubmitting || isCompressing}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition cursor-pointer ${
                showYoutubeInput
                  ? 'bg-red-100 text-red-800 font-bold'
                  : 'hover:bg-stone-100 text-red-600'
              } disabled:opacity-40`}
              title="Embed YouTube Video"
              aria-label="Embed YouTube Video"
            >
              <span>▶</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePrayer}
              disabled={isSubmitting || isCompressing}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition cursor-pointer ${
                selectedCategory || mode === 'prayer'
                  ? 'bg-amber-100 text-amber-900 font-bold ring-1 ring-amber-300'
                  : 'hover:bg-stone-100 text-amber-700'
              } disabled:opacity-40`}
              title="Prayer Request Tag"
              aria-label="Prayer Request Tag"
            >
              <span>🙏</span>
            </button>
          </div>

          {/* Post to Community Submit Button */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={
              isSubmitting ||
              isCompressing ||
              (!content.trim() && !extractedVideoId && attachedPhotos.length === 0)
            }
            className="bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-bold text-xs px-5 sm:px-6 py-2.5 rounded-full transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
          >
            {isCompressing ? (
              <span>Compressing...</span>
            ) : isSubmitting ? (
              <span>Publishing...</span>
            ) : (
              <span>Post to Community</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostComposerModal;
