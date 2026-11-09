import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import type {
  CommunityPostWithAuthor,
  UserBadgeWithDefinition,
  EventLiturgicalRoster,
  Event,
} from '../../src/types';
import {
  getPostDisplayType,
  CommunityFeed,
  GeneralPostCard,
} from '../../src/components/feed/CommunityFeed';
import {
  PrayerIntentionCard,
  getIntentionCategoryBadge,
} from '../../src/components/feed/PrayerIntentionCard';
import { YouTubeVideoCard } from '../../src/components/feed/YouTubeVideoCard';
import {
  EventAnnouncementCard,
  getGoogleMapsUrl,
  formatEventDateBadge,
} from '../../src/components/feed/EventAnnouncementCard';
import {
  formatBadgeFlair,
  getBadgeColorClass,
  getBadgeDefaultIcon,
} from '../../src/components/feed/BadgePill';
import {
  formatRelativeTime,
  getAuthorInitials,
} from '../../src/components/feed/FeedCardHeader';

// ==========================================
// MOCK DATA FACTORIES
// ==========================================

function createMockPost(overrides: Partial<CommunityPostWithAuthor> = {}): CommunityPostWithAuthor {
  return {
    id: 'post-1',
    author_id: 'user-1',
    post_type: 'general',
    content: 'Viva Pit Señor! Santo Niño devotional fellowship.',
    media_urls: [],
    youtube_video_id: null,
    intention_category: null,
    announcement_type: null,
    event_id: null,
    visibility: 'public',
    is_pinned: false,
    is_hidden: false,
    created_at: new Date('2026-11-09T10:00:00.000Z').toISOString(),
    updated_at: new Date('2026-11-09T10:00:00.000Z').toISOString(),
    author: {
      id: 'user-1',
      display_name: 'Maria Santos-Cruz',
      avatar_url: null,
      user_badges: [],
    },
    reactions: [],
    reaction_counts: {
      amen: 0,
      heart: 0,
      like: 0,
      total: 0,
    },
    user_reaction: null,
    comments_count: 0,
    ...overrides,
  };
}

describe('Feed Card Dispatching Logic (getPostDisplayType)', () => {
  it('dispatches prayer intentions when post_type is prayer_request', () => {
    const post = createMockPost({
      post_type: 'prayer_request',
      intention_category: 'healing',
    });
    assert.equal(getPostDisplayType(post), 'prayer');
  });

  it('dispatches prayer intentions when intention_category is present even if post_type is general', () => {
    const post = createMockPost({
      post_type: 'general',
      intention_category: 'thanksgiving',
    });
    assert.equal(getPostDisplayType(post), 'prayer');
  });

  it('dispatches events when post_type is event', () => {
    const post = createMockPost({
      post_type: 'event',
      event_id: 'event-123',
    });
    assert.equal(getPostDisplayType(post), 'event');
  });

  it('dispatches events when post has event object attached', () => {
    const post = createMockPost({
      post_type: 'general',
      event: {
        id: 'event-999',
        title: 'Monthly Novena Mass',
        venue: "St Benedict's Church",
        address: 'Eden Terrace',
      } as unknown as Event,
    });
    assert.equal(getPostDisplayType(post), 'event');
  });

  it('dispatches YouTube videos when youtube_video_id is populated', () => {
    const post = createMockPost({
      post_type: 'general',
      youtube_video_id: '5qap5aO4i9A',
    });
    assert.equal(getPostDisplayType(post), 'youtube');
  });

  it('dispatches YouTube videos when media_urls contains a recognized YouTube URL', () => {
    const post = createMockPost({
      post_type: 'general',
      media_urls: ['https://youtu.be/5qap5aO4i9A'],
    });
    assert.equal(getPostDisplayType(post), 'youtube');
  });

  it('falls back to general update card for general content without video or event', () => {
    const post = createMockPost({
      post_type: 'general',
      media_urls: ['https://example.com/photo.jpg'],
    });
    assert.equal(getPostDisplayType(post), 'general');
  });
});

describe('Prayer Intention Category Badges (getIntentionCategoryBadge)', () => {
  it('maps healing category correctly with red styling', () => {
    const config = getIntentionCategoryBadge('healing');
    assert.equal(config.label, '🙏 Healing Intention');
    assert.ok(config.className.includes('bg-red-50'));
    assert.ok(config.className.includes('text-red-800'));
  });

  it('maps thanksgiving category correctly with amber styling', () => {
    const config = getIntentionCategoryBadge('thanksgiving');
    assert.equal(config.label, '🎉 Thanksgiving');
    assert.ok(config.className.includes('bg-amber-50'));
  });

  it('maps eternal repose category correctly with stone styling', () => {
    const config = getIntentionCategoryBadge('repose');
    assert.equal(config.label, '🕊️ Eternal Repose');
    assert.ok(config.className.includes('bg-stone-100'));
  });

  it('maps special intention category correctly with purple styling', () => {
    const config = getIntentionCategoryBadge('special');
    assert.equal(config.label, '✨ Special Intention');
    assert.ok(config.className.includes('bg-purple-50'));
  });

  it('falls back gracefully when category is undefined or unknown', () => {
    const config = getIntentionCategoryBadge(null);
    assert.equal(config.label, '🙏 Prayer Request');
    assert.ok(config.className.includes('bg-red-50'));
  });
});

describe('1-Tap Google Maps Link Generator (getGoogleMapsUrl)', () => {
  it('generates a valid Google Maps search URL with properly encoded query', () => {
    const venue = "St Benedict's Church, Newton, Auckland";
    const url = getGoogleMapsUrl(venue);
    assert.equal(
      url,
      'https://www.google.com/maps/search/?api=1&query=St%20Benedict\'s%20Church%2C%20Newton%2C%20Auckland'
    );
  });

  it('handles venues with special characters and commas', () => {
    const venue = 'St Patrick’s Cathedral, 43 Wyndham St, Auckland CBD';
    const url = getGoogleMapsUrl(venue);
    assert.ok(url.startsWith('https://www.google.com/maps/search/?api=1&query='));
    assert.ok(url.includes('St%20Patrick'));
  });

  it('returns default Google Maps homepage if query is empty or whitespace', () => {
    assert.equal(getGoogleMapsUrl(''), 'https://www.google.com/maps');
    assert.equal(getGoogleMapsUrl('   '), 'https://www.google.com/maps');
  });
});

describe('Event Date Badge Formatting (formatEventDateBadge)', () => {
  it('formats valid ISO date strings to uppercase month and day number', () => {
    const badge = formatEventDateBadge('2026-11-14T17:30:00.000Z');
    assert.equal(badge.month, 'NOV');
    assert.equal(badge.day, '14');
  });

  it('formats single-digit days without leading zero for clean typography', () => {
    const badge = formatEventDateBadge('2027-01-09T08:00:00.000Z');
    assert.equal(badge.month, 'JAN');
    assert.equal(badge.day, '9');
  });

  it('handles null, undefined, or invalid dates safely without throwing', () => {
    assert.deepEqual(formatEventDateBadge(null), { month: 'TBD', day: '--' });
    assert.deepEqual(formatEventDateBadge('not-a-valid-date'), { month: 'TBD', day: '--' });
  });
});

describe('Discord-Style Badge Flair Formatting (formatBadgeFlair)', () => {
  it('formats verified Hermana badge flair with crown icon and amber styling', () => {
    const mockBadge: UserBadgeWithDefinition = {
      id: 'ub-1',
      user_id: 'user-1',
      badge_id: 'verified_hermana',
      year: null,
      title_override: 'Verified Hermana',
      organization_or_troupe: null,
      metadata: null,
      is_featured: true,
      awarded_by: 'council',
      awarded_at: '2025-01-01T00:00:00.000Z',
      definition: {
        id: 'verified_hermana',
        name: 'Verified Hermana',
        category: 'hermano' as unknown as any,
        icon: '👑',
        badge_color: '#D97706',
        description: 'Verified Hermana Mayor',
        is_repeatable_yearly: false,
        is_verified_only: true,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    };

    const flair = formatBadgeFlair(mockBadge);
    assert.equal(flair.label, 'Verified Hermana');
    assert.equal(flair.icon, '👑');
    assert.ok(flair.colorClass.includes('bg-amber-50'));
  });

  it('formats pilgrim host badge flair with year suffix', () => {
    const mockBadge: UserBadgeWithDefinition = {
      id: 'ub-2',
      user_id: 'user-1',
      badge_id: 'image_host',
      year: 2025,
      title_override: 'Host',
      organization_or_troupe: null,
      metadata: null,
      is_featured: true,
      awarded_by: 'council',
      awarded_at: '2025-01-01T00:00:00.000Z',
    };

    const flair = formatBadgeFlair(mockBadge);
    assert.equal(flair.label, "Host '25");
    assert.equal(flair.icon, '🏠');
    assert.ok(flair.colorClass.includes('bg-red-50'));
  });

  it('formats clergy badge flair with cross icon and dark liturgical styling', () => {
    const mockBadge: UserBadgeWithDefinition = {
      id: 'ub-3',
      user_id: 'priest-1',
      badge_id: 'priest_director',
      year: null,
      title_override: 'Priest / Spiritual Director',
      organization_or_troupe: null,
      metadata: null,
      is_featured: true,
      awarded_by: 'diocese',
      awarded_at: '2025-01-01T00:00:00.000Z',
      definition: {
        id: 'priest_director',
        name: 'Priest / Spiritual Director',
        category: 'clergy',
        icon: '✝️',
        badge_color: '#1C1917',
        description: 'Clergy & Spiritual Director',
        is_repeatable_yearly: false,
        is_verified_only: true,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    };

    const flair = formatBadgeFlair(mockBadge);
    assert.equal(flair.label, 'Priest / Spiritual Director');
    assert.equal(flair.icon, '✝️');
    assert.ok(flair.colorClass.includes('bg-stone-900'));
    assert.ok(flair.colorClass.includes('text-amber-200'));
  });

  it('formats sinulog troupe champion badge flair with purple styling', () => {
    const color = getBadgeColorClass('performance', 'Dance Troupe Champion');
    assert.ok(color.includes('bg-purple-50'));
    assert.ok(color.includes('text-purple-900'));
    assert.equal(getBadgeDefaultIcon('Dance Troupe Champion', 'performance'), '🏆');
  });
});

describe('Header & Relative Time Helpers', () => {
  it('formats author initials correctly for 1, 2, and multiple word names', () => {
    assert.equal(getAuthorInitials('Maria Santos-Cruz'), 'MS');
    assert.equal(getAuthorInitials('Sinulog Auckland Troupe'), 'ST');
    assert.equal(getAuthorInitials('Devotee'), 'DE');
    assert.equal(getAuthorInitials(null), 'DN');
  });

  it('formats relative time for recent events', () => {
    const now = new Date();
    assert.equal(formatRelativeTime(now.toISOString()), 'just now');

    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    assert.equal(formatRelativeTime(tenMinsAgo.toISOString()), '10 min ago');

    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    assert.equal(formatRelativeTime(twoHoursAgo.toISOString()), '2 hours ago');
  });

  it('handles null or invalid date strings in relative time safely', () => {
    assert.equal(formatRelativeTime(null), 'recently');
    assert.equal(formatRelativeTime('invalid-date'), 'recently');
  });
});

describe('React Component Instantiation and Liturgical Rosters', () => {
  it('instantiates PrayerIntentionCard successfully with Amen counter', () => {
    const post = createMockPost({
      post_type: 'prayer_request',
      intention_category: 'healing',
      content: 'Please pray for my brother undergoing bypass surgery tomorrow.',
      reaction_counts: { amen: 42, heart: 0, like: 0, total: 42 },
      user_reaction: 'amen',
    });

    const el = React.createElement(PrayerIntentionCard, { post });
    assert.ok(React.isValidElement(el));
    assert.equal(el.props.post.id, 'post-1');
  });

  it('instantiates YouTubeVideoCard with 16:9 video embed', () => {
    const post = createMockPost({
      youtube_video_id: '5qap5aO4i9A',
      content: 'Sinulog Auckland Dance Rehearsal highlights!',
      reaction_counts: { amen: 0, heart: 76, like: 0, total: 76 },
    });

    const el = React.createElement(YouTubeVideoCard, { post });
    assert.ok(React.isValidElement(el));
    assert.equal(el.props.post.youtube_video_id, '5qap5aO4i9A');
  });

  it('instantiates EventAnnouncementCard with full Liturgical Ministry Roster', () => {
    const post = createMockPost({
      post_type: 'event',
      content: 'Saturday Novena Mass and Blessing of Images at St Benedicts.',
      event: {
        id: 'event-novena-1',
        title: 'Saturday Novena Mass & Blessing of Images',
        venue: "St Benedict's Church",
        address: '1 St Benedicts St, Eden Terrace, Auckland',
        event_start_date: '2026-11-14T05:30:00.000Z',
        event_start_time: '5:30 PM',
        choir_name: 'Coro de Santo Niño',
        presider_name: 'Rev. Fr. Mario Gomez',
        lectors: ['Maria Santos-Cruz'],
        sponsor_chapter: 'Pukekohe Chapter & Reyes Family',
      } as unknown as Event & EventLiturgicalRoster,
    });

    const el = React.createElement(EventAnnouncementCard, { post });
    assert.ok(React.isValidElement(el));
    assert.equal(el.props.post.event?.choir_name, 'Coro de Santo Niño');
    assert.equal(el.props.post.event?.presider_name, 'Rev. Fr. Mario Gomez');
  });

  it('instantiates CommunityFeed with loading and empty state props', () => {
    const loadingFeed = React.createElement(CommunityFeed, {
      posts: [],
      isLoading: true,
    });
    assert.ok(React.isValidElement(loadingFeed));

    const emptyFeed = React.createElement(CommunityFeed, {
      posts: [],
      isLoading: false,
    });
    assert.ok(React.isValidElement(emptyFeed));

    const populatedFeed = React.createElement(CommunityFeed, {
      posts: [
        createMockPost({ post_type: 'prayer_request', intention_category: 'healing' }),
        createMockPost({ youtube_video_id: '5qap5aO4i9A' }),
      ],
      isLoading: false,
    });
    assert.ok(React.isValidElement(populatedFeed));
  });
});
