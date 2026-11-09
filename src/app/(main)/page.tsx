'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { message } from 'antd';
import {
  PictureOutlined,
  YoutubeOutlined,
  HeartOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/Sidebar';
import { StoriesBar, CommunityFeed, PostComposerModal } from '@/components/feed';
import { NovenaReaderModal } from '@/components/prayers/NovenaReaderModal';
import { ChoirRotationModal } from '@/components/events/ChoirRotationModal';
import { HonorRibbonsModal } from '@/components/profile/HonorRibbonsModal';
import { communityFeedApi } from '@/lib/supabase-api';
import type {
  CommunityPost,
  CommunityPostWithAuthor,
  PostReactionType,
} from '@/types';

// ==========================================
// HIGH-FIDELITY SAMPLE FEED DATA (Matching public/prototype.html)
// ==========================================

export const INITIAL_SAMPLE_POSTS: CommunityPostWithAuthor[] = [
  {
    id: 'sample-post-1',
    author_id: 'user-maria',
    post_type: 'prayer_request',
    content:
      'Please join our family in praying for my brother Kuya Noel in Cebu who is undergoing emergency bypass surgery tomorrow morning. Asking for Señor Santo Niño’s miraculous healing, steady hands for the surgeons, and complete recovery. Viva Pit Señor!',
    media_urls: [],
    youtube_video_id: null,
    intention_category: 'healing',
    announcement_type: null,
    event_id: null,
    visibility: 'public',
    is_pinned: false,
    is_hidden: false,
    comments_count: 8,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_reaction: null,
    reaction_counts: { amen: 42, heart: 0, like: 0, total: 42 },
    author: {
      id: 'user-maria',
      display_name: 'Maria Santos-Cruz',
      avatar_url: null,
      user_badges: [
        {
          id: 'badge-1',
          user_id: 'user-maria',
          badge_id: 'b-hermana',
          year: 2025,
          title_override: null,
          organization_or_troupe: 'Hermana Mayor Guild',
          metadata: null,
          is_featured: true,
          awarded_by: null,
          awarded_at: '2025-01-15T00:00:00.000Z',
          definition: {
            id: 'b-hermana',
            name: 'Verified Hermana',
            category: 'service',
            icon: '👑',
            description: 'Hermana Mayor Guild',
            is_repeatable_yearly: false,
            badge_color: 'amber',
            is_verified_only: true,
            created_at: '2025-01-01T00:00:00.000Z',
          },
        },
        {
          id: 'badge-2',
          user_id: 'user-maria',
          badge_id: 'b-host',
          year: 2025,
          title_override: "Host '25",
          organization_or_troupe: 'Pilgrim Image Hosts',
          metadata: null,
          is_featured: true,
          awarded_by: null,
          awarded_at: '2025-06-01T00:00:00.000Z',
          definition: {
            id: 'b-host',
            name: "Host '25",
            category: 'devotional',
            icon: '🏠',
            description: 'Pilgrim Image Host 2025',
            is_repeatable_yearly: false,
            badge_color: 'rose',
            is_verified_only: true,
            created_at: '2025-01-01T00:00:00.000Z',
          },
        },
      ],
    },
  },
  {
    id: 'sample-post-2',
    author_id: 'user-troupe',
    post_type: 'general',
    content:
      'Viva Pit Señor! 🥁💃 Relive the joyous moments from our Sinulog street dance rehearsal. Auditions and registration are now open for youth dancers, drummers, and Sinulog Queen candidates for Fiesta 2027!',
    media_urls: [],
    youtube_video_id: '5qap5aO4i9A',
    intention_category: null,
    announcement_type: null,
    event_id: null,
    visibility: 'public',
    is_pinned: false,
    is_hidden: false,
    comments_count: 14,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user_reaction: 'heart',
    reaction_counts: { amen: 0, heart: 76, like: 15, total: 91 },
    author: {
      id: 'user-troupe',
      display_name: 'Sinulog Auckland Troupe',
      avatar_url: null,
      user_badges: [
        {
          id: 'badge-3',
          user_id: 'user-troupe',
          badge_id: 'b-troupe',
          year: 2026,
          title_override: null,
          organization_or_troupe: 'Sinulog Auckland Troupe',
          metadata: null,
          is_featured: true,
          awarded_by: null,
          awarded_at: '2026-01-18T00:00:00.000Z',
          definition: {
            id: 'b-troupe',
            name: 'Sinulog Troupe',
            category: 'performance',
            icon: '🏆',
            description: 'Dance Troupe Champion',
            is_repeatable_yearly: true,
            badge_color: 'purple',
            is_verified_only: true,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        },
        {
          id: 'badge-4',
          user_id: 'user-troupe',
          badge_id: 'b-dancers',
          year: 2026,
          title_override: "Dancers '26",
          organization_or_troupe: 'Sinulog Dance Troupe',
          metadata: null,
          is_featured: true,
          awarded_by: null,
          awarded_at: '2026-01-18T00:00:00.000Z',
          definition: {
            id: 'b-dancers',
            name: "Dancers '26",
            category: 'performance',
            icon: '💃',
            description: 'Sinulog Dancers 2024-2026',
            is_repeatable_yearly: true,
            badge_color: 'amber',
            is_verified_only: false,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        },
      ],
    },
  },
  {
    id: 'sample-post-3',
    author_id: 'user-clergy',
    post_type: 'event',
    content:
      'All devotees and families are warmly invited to this Saturday’s Monthly Novena Mass and Blessing of Images. Bring your personal Santo Niño statues for the solemn blessing right after Mass. Potluck fellowship follows at the parish hall!',
    media_urls: [],
    youtube_video_id: null,
    intention_category: null,
    announcement_type: null,
    event_id: 'event-novena-mass',
    visibility: 'public',
    is_pinned: true,
    is_hidden: false,
    comments_count: 6,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    user_reaction: null,
    reaction_counts: { amen: 51, heart: 0, like: 0, total: 51 },
    author: {
      id: 'user-clergy',
      display_name: 'Rev. Fr. Mario Gomez',
      avatar_url: null,
      user_badges: [
        {
          id: 'badge-5',
          user_id: 'user-clergy',
          badge_id: 'b-priest',
          year: 2024,
          title_override: 'Priest / Spiritual Director',
          organization_or_troupe: 'St Patrick’s Cathedral Parish',
          metadata: null,
          is_featured: true,
          awarded_by: null,
          awarded_at: '2024-01-01T00:00:00.000Z',
          definition: {
            id: 'b-priest',
            name: 'Priest / Spiritual Director',
            category: 'clergy',
            icon: '✝️',
            description: 'Clergy & Spiritual Director',
            is_repeatable_yearly: false,
            badge_color: 'stone',
            is_verified_only: true,
            created_at: '2024-01-01T00:00:00.000Z',
          },
        },
      ],
    },
    event: {
      id: 'event-novena-mass',
      slug: 'saturday-novena-mass-nov-14',
      title: 'Saturday Novena Mass & Blessing of Images',
      type: 'dated',
      recurrence: null,
      time: '5:30 PM',
      start_date: '2026-11-14T17:30:00.000Z',
      end_date: '2026-11-14T19:00:00.000Z',
      rosary_time: '5:00 PM',
      parking_info: null,
      venue: "St Benedict's Church, Newton, Auckland",
      address: '1 St Benedicts St, Eden Terrace, Auckland',
      content: 'Monthly Novena Mass and solemn blessing of personal Santo Niño statues.',
      published: true,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
      created_by: 'user-clergy',
      last_modified_by: 'user-clergy',
      category: 'novena',
      visibility: 'public',
      description: 'Monthly Novena Mass and solemn blessing of personal Santo Niño statues.',
      featured_image: null,
      allowed_roles: null,
      allowed_areas: null,
      allowed_groups: null,
      location_coords: null,
      is_online: false,
      online_link: null,
      event_start_date: '2026-11-14',
      event_end_date: '2026-11-14',
      event_start_time: '17:30',
      event_end_time: '19:00',
      is_all_day: false,
      organizer_id: 'user-clergy',
      presider_name: 'Rev. Fr. Mario Gomez',
      presider_id: 'user-clergy',
      choir_name: 'Coro de Santo Niño (North Shore)',
      choir_group_id: null,
      lectors: ['Maria Santos-Cruz'],
      acolytes_guild: null,
      sponsor_chapter: 'Pukekohe Chapter & Reyes Family',
      mass_sequence_number: 1,
    },
  },
];

export default function CommunityFeedPage() {
  const { user, profile } = useAuth();

  // Feed State
  const [posts, setPosts] = useState<CommunityPostWithAuthor[]>(INITIAL_SAMPLE_POSTS);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);

  // Modals Visibility
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [composerMode, setComposerMode] = useState<'general' | 'prayer' | 'video' | 'photo'>('general');
  const [isNovenaOpen, setIsNovenaOpen] = useState<boolean>(false);
  const [novenaDay, setNovenaDay] = useState<number>(3);
  const [isChoirModalOpen, setIsChoirModalOpen] = useState<boolean>(false);
  const [isHonorRibbonsOpen, setIsHonorRibbonsOpen] = useState<boolean>(false);

  // Urgent Intentions Widget Interactive Amen Counters
  const [urgentAmen1, setUrgentAmen1] = useState<number>(42);
  const [hasPrayedUrgent1, setHasPrayedUrgent1] = useState<boolean>(false);
  const [urgentAmen2, setUrgentAmen2] = useState<number>(68);
  const [hasPrayedUrgent2, setHasPrayedUrgent2] = useState<boolean>(false);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Devotee';

  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'EM';

  // Load feed from Supabase
  const loadPosts = useCallback(async () => {
    try {
      setIsLoadingFeed(true);
      const fetched = await communityFeedApi.getFeedPosts({ limit: 25 });
      if (fetched && fetched.length > 0) {
        // Prepend real Supabase posts and retain sample cards below for complete UI fidelity
        const existingIds = new Set(fetched.map((p) => p.id));
        const extraSamples = INITIAL_SAMPLE_POSTS.filter((s) => !existingIds.has(s.id));
        setPosts([...fetched, ...extraSamples]);
      }
    } catch {
      // Fallback already pre-set to INITIAL_SAMPLE_POSTS
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Global Event Listeners for Header & Sidebar quick triggers
  useEffect(() => {
    const handleOpenComposerEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: 'general' | 'prayer' | 'video' | 'photo' }>;
      setComposerMode(customEvent.detail?.mode || 'general');
      setIsComposerOpen(true);
    };

    const handleOpenNovenaEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ day?: number }>;
      setNovenaDay(customEvent.detail?.day || 3);
      setIsNovenaOpen(true);
    };

    const handleOpenChoirEvent = () => {
      setIsChoirModalOpen(true);
    };

    const handleOpenHonorRibbonsEvent = () => {
      setIsHonorRibbonsOpen(true);
    };

    window.addEventListener('sn-open-post-composer', handleOpenComposerEvent);
    window.addEventListener('sn-open-novena', handleOpenNovenaEvent);
    window.addEventListener('sn-open-choir-modal', handleOpenChoirEvent);
    window.addEventListener('sn-open-honor-ribbons', handleOpenHonorRibbonsEvent);

    return () => {
      window.removeEventListener('sn-open-post-composer', handleOpenComposerEvent);
      window.removeEventListener('sn-open-novena', handleOpenNovenaEvent);
      window.removeEventListener('sn-open-choir-modal', handleOpenChoirEvent);
      window.removeEventListener('sn-open-honor-ribbons', handleOpenHonorRibbonsEvent);
    };
  }, []);

  // Post Composer Trigger
  const handleOpenComposer = (mode: 'general' | 'prayer' | 'video' | 'photo' = 'general') => {
    setComposerMode(mode);
    setIsComposerOpen(true);
  };

  // Open Novena Reader Modal
  const handleOpenNovenaModal = (day: number = 3) => {
    setNovenaDay(day);
    setIsNovenaOpen(true);
  };

  // Optimistic Post Created
  const handlePostCreated = (newPost: CommunityPost) => {
    const isPrayer = newPost.post_type === 'prayer_request';
    const enrichedPost: CommunityPostWithAuthor = {
      ...newPost,
      media_urls: newPost.media_urls || [],
      youtube_video_id: newPost.youtube_video_id || null,
      intention_category: newPost.intention_category || null,
      announcement_type: newPost.announcement_type || null,
      event_id: newPost.event_id || null,
      visibility: newPost.visibility || 'public',
      is_pinned: Boolean(newPost.is_pinned),
      is_hidden: false,
      author: {
        id: profile?.id || user?.id || 'current-user',
        display_name: displayName,
        avatar_url: profile?.avatar_url || null,
        user_badges: [],
      },
      user_reaction: isPrayer ? 'amen' : null,
      reaction_counts: {
        amen: isPrayer ? 1 : 0,
        heart: 0,
        like: 0,
        total: isPrayer ? 1 : 0,
      },
      comments_count: 0,
    };

    setPosts((prev) => [enrichedPost, ...prev]);
    setIsComposerOpen(false);
    message.success('Your intention has been shared with the devotion community!');
  };

  // Optimistic Amen Toggle
  const handleAmenToggle = async (postId: string) => {
    const currentUserId = user?.id || profile?.id || 'guest-user';
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const willBeAmened = post.user_reaction !== 'amen';
        const currentCount = post.reaction_counts?.amen || 0;
        const newCount = willBeAmened ? currentCount + 1 : Math.max(0, currentCount - 1);
        return {
          ...post,
          user_reaction: willBeAmened ? ('amen' as PostReactionType) : null,
          reaction_counts: {
            amen: newCount,
            heart: post.reaction_counts?.heart || 0,
            like: post.reaction_counts?.like || 0,
            total: newCount + (post.reaction_counts?.heart || 0) + (post.reaction_counts?.like || 0),
          },
        };
      })
    );

    try {
      await communityFeedApi.toggleAmen(postId, currentUserId);
    } catch {
      // Keep optimistic state for static preview
    }
  };

  // Optimistic Reaction Toggle (Heart / Like)
  const handleReactionToggle = async (postId: string, reactionType: PostReactionType) => {
    const currentUserId = user?.id || profile?.id || 'guest-user';
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const isCurrent = post.user_reaction === reactionType;
        const currentHeart = post.reaction_counts?.heart || 0;
        const currentLike = post.reaction_counts?.like || 0;
        const currentAmen = post.reaction_counts?.amen || 0;

        let newHeart = currentHeart;
        let newLike = currentLike;

        if (reactionType === 'heart') {
          newHeart = isCurrent ? Math.max(0, currentHeart - 1) : currentHeart + 1;
        } else if (reactionType === 'like') {
          newLike = isCurrent ? Math.max(0, currentLike - 1) : currentLike + 1;
        }

        return {
          ...post,
          user_reaction: isCurrent ? null : reactionType,
          reaction_counts: {
            amen: currentAmen,
            heart: newHeart,
            like: newLike,
            total: currentAmen + newHeart + newLike,
          },
        };
      })
    );

    try {
      await communityFeedApi.toggleReaction(postId, currentUserId, reactionType);
    } catch {
      // Retain optimistic state
    }
  };

  // Optimistic RSVP Toggle
  const handleRsvpToggle = async (_eventId: string, currentStatus: boolean) => {
    if (!currentStatus) {
      message.success('RSVP confirmed! See you at Holy Mass. Viva Pit Señor!');
    }
  };

  // Delete Community Post Handler
  const handleDeletePost = async (postId: string) => {
    try {
      await communityFeedApi.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      message.success('Post removed from community feed.');
    } catch (err) {
      console.error('Failed to delete post:', err);
      message.error('Failed to delete post. Please try again.');
    }
  };

  // Urgent Intentions Interactive Toggles
  const handleToggleUrgentAmen1 = () => {
    if (hasPrayedUrgent1) {
      setUrgentAmen1((prev) => Math.max(0, prev - 1));
      setHasPrayedUrgent1(false);
    } else {
      setUrgentAmen1((prev) => prev + 1);
      setHasPrayedUrgent1(true);
      message.success('Amen! Your prayers are united for Kuya Noel’s recovery.');
    }
  };

  const handleToggleUrgentAmen2 = () => {
    if (hasPrayedUrgent2) {
      setUrgentAmen2((prev) => Math.max(0, prev - 1));
      setHasPrayedUrgent2(false);
    } else {
      setUrgentAmen2((prev) => prev + 1);
      setHasPrayedUrgent2(true);
      message.success('You joined the Santos family in thanksgiving!');
    }
  };

  // Gospel Story Trigger
  const handleOpenGospel = () => {
    message.info(
      "Today's Sacred Gospel: Luke 18:15-17 — 'Truly I tell you, anyone who will not receive the kingdom of God like a little child will never enter it.'"
    );
  };

  // Fiesta Countdown Story Trigger
  const handleOpenFiestaCountdown = () => {
    message.success(
      'Sinulog Auckland Festival 2027: Only 68 Days to go! Auditions for Dancers and Drummers are now open.'
    );
  };

  // Badge click trigger
  const handleBadgeClick = (_badgeName: string) => {
    setIsHonorRibbonsOpen(true);
  };

  // Share post trigger
  const handleShareClick = (post: CommunityPostWithAuthor) => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Santo Niño NZ Devotees Community',
          text: post.content,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      message.success('Post link copied to clipboard!');
    }
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-2 sm:px-6 py-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ================= LEFT COLUMN (Desktop ≥768px: md:col-span-4 lg:col-span-3) ================= */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4">
          <Sidebar
            onOpenNovena={handleOpenNovenaModal}
            onOpenProfile={() => setIsHonorRibbonsOpen(true)}
            onBadgeClick={handleBadgeClick}
          />
        </aside>

        {/* ================= CENTER STREAM (Feed & Composer: col-span-1 md:col-span-8 lg:col-span-6) ================= */}
        <section className="col-span-1 md:col-span-8 lg:col-span-6 space-y-5 pb-24 md:pb-10">
          {/* DEVOTIONAL STORIES BAR (Top Carousel) */}
          <StoriesBar
            currentNovenaDay={3}
            totalNovenaDays={9}
            novenaTheme="Petitions"
            onOpenNovena={handleOpenNovenaModal}
            onOpenGospel={handleOpenGospel}
            onOpenFiestaCountdown={handleOpenFiestaCountdown}
            onShareReflection={() => handleOpenComposer('general')}
          />

          {/* POST COMPOSER TRIGGER CARD */}
          <div className="bg-white rounded-2xl p-4 border border-[#EFEAE2] shadow-sm space-y-3">
            <div className="flex items-center space-x-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 flex-shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-800 text-white font-bold flex items-center justify-center text-sm ring-2 ring-amber-400 flex-shrink-0 shadow-sm font-cinzel">
                  {userInitials}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleOpenComposer('general')}
                className="w-full text-left bg-[#F5F2EC] hover:bg-[#EFEAE2] text-stone-500 px-4 py-3 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer border-0"
              >
                Share a prayer, festival reflection, or devotion...
              </button>
            </div>

            <div className="border-t border-stone-100 pt-3 flex items-center justify-around text-xs sm:text-sm font-bold text-stone-600">
              <button
                type="button"
                onClick={() => handleOpenComposer('photo')}
                className="flex items-center space-x-2 py-2 px-3 rounded-xl hover:bg-stone-50 text-emerald-700 transition cursor-pointer border-0 bg-transparent"
              >
                <PictureOutlined className="text-base" />
                <span>Photo</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenComposer('video')}
                className="flex items-center space-x-2 py-2 px-3 rounded-xl hover:bg-stone-50 text-red-700 transition cursor-pointer border-0 bg-transparent"
              >
                <YoutubeOutlined className="text-base" />
                <span>YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenComposer('prayer')}
                className="flex items-center space-x-2 py-2 px-3 rounded-xl hover:bg-stone-50 text-amber-700 transition cursor-pointer border-0 bg-transparent"
              >
                <HeartOutlined className="text-base" />
                <span>Prayer Request</span>
              </button>
            </div>
          </div>

          {/* COMMUNITY POSTS STREAM */}
          <CommunityFeed
            posts={posts}
            isLoading={isLoadingFeed}
            currentUserId={user?.id || profile?.id || null}
            onAmenToggle={handleAmenToggle}
            onReactionToggle={handleReactionToggle}
            onRsvpToggle={handleRsvpToggle}
            onOpenChoirSchedule={() => setIsChoirModalOpen(true)}
            onBadgeClick={handleBadgeClick}
            onShareClick={handleShareClick}
            onDeletePost={handleDeletePost}
          />
        </section>

        {/* ================= RIGHT COLUMN (Desktop ≥1024px: lg:col-span-3) ================= */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          {/* WIDGET 1: DAILY NOVENA GUIDE */}
          <div className="bg-white rounded-2xl p-4 border border-[#EFEAE2] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-red-800 font-cinzel flex items-center gap-1.5">
                <span>📿</span>
                <span>Daily Devotion</span>
              </div>
              <span className="text-[11px] bg-red-50 text-red-900 font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                Day 3 of 9
              </span>
            </div>

            <div>
              <div className="font-bold text-sm text-stone-900 font-cinzel">
                Novena to Señor Santo Niño
              </div>
              <div className="text-xs text-stone-500 mt-1 leading-relaxed">
                Petitions for peace in our homes and health for our overseas family members.
              </div>
            </div>

            {/* 9 Days Visual Progress Track */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-stone-400 font-bold">
                <span>Progress: 3 / 9 Days</span>
                <span className="text-emerald-700 font-bold">33%</span>
              </div>
              <div className="grid grid-cols-9 gap-1 pt-0.5">
                <div className="h-2 rounded-full bg-red-800" title="Day 1 Done" />
                <div className="h-2 rounded-full bg-red-800" title="Day 2 Done" />
                <div
                  className="h-2 rounded-full bg-amber-500 ring-2 ring-amber-300 animate-pulse"
                  title="Day 3 Today"
                />
                <div className="h-2 rounded-full bg-stone-200" title="Day 4" />
                <div className="h-2 rounded-full bg-stone-200" title="Day 5" />
                <div className="h-2 rounded-full bg-stone-200" title="Day 6" />
                <div className="h-2 rounded-full bg-stone-200" title="Day 7" />
                <div className="h-2 rounded-full bg-stone-200" title="Day 8" />
                <div className="h-2 rounded-full bg-stone-200" title="Day 9" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNovenaModal(3)}
              className="w-full bg-red-800 hover:bg-red-900 text-white font-bold text-xs py-2.5 rounded-xl transition shadow flex items-center justify-center space-x-2 cursor-pointer border-0"
            >
              <BookOutlined className="text-sm" />
              <span>Pray Today’s Novena (Day 3)</span>
            </button>
          </div>

          {/* WIDGET 2: UPCOMING LITURGY & FESTIVAL CALENDAR */}
          <div className="bg-white rounded-2xl p-4 border border-[#EFEAE2] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 font-cinzel">
                Upcoming Calendar
              </span>
              <Link href="/events" className="text-xs text-red-800 font-bold hover:underline no-underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {/* Calendar Item 1 */}
              <Link
                href="/events"
                className="flex items-start space-x-3 text-inherit no-underline hover:bg-stone-50 p-1.5 -mx-1.5 rounded-xl transition"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-800 border border-red-200 flex flex-col items-center justify-center font-bold flex-shrink-0 shadow-sm">
                  <span className="text-[9px] uppercase font-bold text-red-600">NOV</span>
                  <span className="text-sm font-cinzel leading-none">14</span>
                </div>
                <div>
                  <div className="font-bold text-stone-900">Saturday Novena Mass</div>
                  <div className="text-stone-500 text-[11px]">5:30 PM • St Benedict&apos;s Newton</div>
                  <span className="text-emerald-700 font-bold text-[10px]">✓ You&apos;re Going</span>
                </div>
              </Link>

              {/* Calendar Item 2 */}
              <Link
                href="/events"
                className="flex items-start space-x-3 text-inherit no-underline hover:bg-stone-50 p-1.5 -mx-1.5 rounded-xl transition"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-50 text-stone-700 border border-stone-200 flex flex-col items-center justify-center font-bold flex-shrink-0">
                  <span className="text-[9px] uppercase font-bold text-stone-400">NOV</span>
                  <span className="text-sm font-cinzel leading-none">15</span>
                </div>
                <div>
                  <div className="font-bold text-stone-900">Sinulog Street Dance Practice</div>
                  <div className="text-stone-500 text-[11px]">2:00 PM • Cathedral Parish Hall</div>
                  <span className="text-stone-400 text-[10px]">24 Dancers attending</span>
                </div>
              </Link>
            </div>
          </div>

          {/* WIDGET 3: URGENT COMMUNITY INTENTIONS */}
          <div className="bg-white rounded-2xl p-4 border border-[#EFEAE2] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 font-cinzel">
                Urgent Intentions
              </span>
              <button
                type="button"
                onClick={() => handleOpenComposer('prayer')}
                className="text-xs text-red-800 font-bold hover:underline cursor-pointer border-0 bg-transparent"
              >
                + Request
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2]">
                <div className="font-bold text-stone-900">Healing for Kuya Noel</div>
                <div className="text-stone-500 text-[11px] mt-0.5 leading-snug">
                  Surgery in Cebu tomorrow morning.
                </div>
                <div className="mt-2.5 flex justify-between items-center">
                  <span className="text-amber-900 font-bold text-[10px]">
                    🙏 {urgentAmen1} Devotees Prayed
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleUrgentAmen1}
                    className={`font-bold text-[11px] cursor-pointer border-0 bg-transparent transition ${
                      hasPrayedUrgent1 ? 'text-emerald-700 font-extrabold' : 'text-red-800 hover:underline'
                    }`}
                  >
                    {hasPrayedUrgent1 ? '✓ Prayed' : 'I Prayed'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2]">
                <div className="font-bold text-stone-900">Thanksgiving: Permanent Residency</div>
                <div className="text-stone-500 text-[11px] mt-0.5 leading-snug">
                  Santos family granted NZ residency!
                </div>
                <div className="mt-2.5 flex justify-between items-center">
                  <span className="text-amber-900 font-bold text-[10px]">
                    🙏 {urgentAmen2} Devotees Prayed
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleUrgentAmen2}
                    className={`font-bold text-[11px] cursor-pointer border-0 bg-transparent transition ${
                      hasPrayedUrgent2 ? 'text-emerald-700 font-extrabold' : 'text-red-800 hover:underline'
                    }`}
                  >
                    {hasPrayedUrgent2 ? '✓ Prayed' : 'I Prayed'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ================= ALL 4 INTERACTIVE MODALS ================= */}

      {/* Modal 1: Post Composer */}
      <PostComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        initialMode={composerMode}
        onPostCreated={handlePostCreated}
      />

      {/* Modal 2: 9-Day Sacred Novena Reader */}
      <NovenaReaderModal
        isOpen={isNovenaOpen}
        onClose={() => setIsNovenaOpen(false)}
        initialDay={novenaDay}
        cycleYear={2026}
        onDayCompleted={(completedDay) => {
          message.success(`Day ${completedDay} Novena completed! Señor Santo Niño bless you.`);
        }}
      />

      {/* Modal 3: Choir Rotation & Liturgical Roster */}
      <ChoirRotationModal
        isOpen={isChoirModalOpen}
        onClose={() => setIsChoirModalOpen(false)}
      />

      {/* Modal 4: Faith & Festival Honor Ribbons */}
      <HonorRibbonsModal
        isOpen={isHonorRibbonsOpen}
        onClose={() => setIsHonorRibbonsOpen(false)}
        userProfile={profile ? ({ ...profile, roles: profile.roles || [] } as any) : null}
      />
    </>
  );
}
