import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  communityFeedApi,
  badgesApi,
  novenasApi,
  novenaProgressApi,
  novenaApi,
  eventsApi,
  formatCommunityPost,
} from '../../src/lib/supabase-api';
import type { EventWithRoster, CommunityPostReaction } from '../../src/types';

describe('communityFeedApi Signatures', () => {
  it('exposes all required community feed methods', () => {
    assert.equal(typeof communityFeedApi.getFeedPosts, 'function');
    assert.equal(typeof communityFeedApi.getPostById, 'function');
    assert.equal(typeof communityFeedApi.createPost, 'function');
    assert.equal(typeof communityFeedApi.toggleAmen, 'function');
    assert.equal(typeof communityFeedApi.toggleReaction, 'function');
    assert.equal(typeof communityFeedApi.getPostComments, 'function');
    assert.equal(typeof communityFeedApi.addComment, 'function');
    assert.equal(typeof communityFeedApi.pinPost, 'function');
    assert.equal(typeof communityFeedApi.hidePost, 'function');
    assert.equal(typeof communityFeedApi.deletePost, 'function');
  });
});

describe('badgesApi Signatures', () => {
  it('exposes all required badge methods', () => {
    assert.equal(typeof badgesApi.getAllBadgeDefinitions, 'function');
    assert.equal(typeof badgesApi.getUserBadges, 'function');
    assert.equal(typeof badgesApi.getUserFeaturedBadges, 'function');
  });
});

describe('novenasApi and novenaProgressApi Signatures', () => {
  it('exposes getUserNovenaProgress and markDayCompleted on novenasApi', () => {
    assert.equal(typeof novenasApi.getUserNovenaProgress, 'function');
    assert.equal(typeof novenasApi.markDayCompleted, 'function');
  });

  it('exposes novenaProgressApi with novena progress methods', () => {
    assert.equal(typeof novenaProgressApi.getUserNovenaProgress, 'function');
    assert.equal(typeof novenaProgressApi.markDayCompleted, 'function');
  });

  it('aliases novenaApi to novenasApi for backward compatibility', () => {
    assert.equal(novenaApi, novenasApi);
  });
});

describe('eventsApi Liturgical Roster Signatures', () => {
  it('exposes getUpcomingEvents and getEventById alongside existing event methods', () => {
    assert.equal(typeof eventsApi.getUpcomingEvents, 'function');
    assert.equal(typeof eventsApi.getEventById, 'function');
    assert.equal(typeof eventsApi.getEvents, 'function');
    assert.equal(typeof eventsApi.getEvent, 'function');
  });

  it('supports liturgical roster fields on EventWithRoster type', () => {
    const mockEventWithRoster: EventWithRoster = {
      id: 'event-roster-1',
      slug: 'fiesta-mass-2026',
      title: 'Fiesta Señor Santo Niño Solemn Mass',
      type: 'dated',
      recurrence: null,
      time: '10:00 AM',
      start_date: '2026-01-18',
      end_date: null,
      rosary_time: '9:30 AM',
      parking_info: 'Available on-site',
      venue: 'St Patrick Cathedral',
      address: '43 Wyndham St, Auckland',
      content: 'Annual Feast Day Mass',
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      last_modified_by: null,
      category: 'sinulog',
      visibility: 'public',
      description: 'Main feast day high mass',
      featured_image: null,
      allowed_roles: null,
      allowed_areas: null,
      allowed_groups: null,
      location_coords: null,
      is_online: false,
      online_link: null,
      event_start_date: '2026-01-18',
      event_end_date: '2026-01-18',
      event_start_time: '10:00:00',
      event_end_time: '12:00:00',
      is_all_day: false,
      organizer_id: null,
      // Liturgical roster fields
      presider_name: 'Fr. Mario Dorado, OFM',
      presider_id: 'presider-123',
      choir_name: 'Auckland Sinulog Choir',
      choir_group_id: 'choir-group-456',
      lectors: ['Maria Santos', 'John Doe'],
      acolytes_guild: 'Knights of the Altar',
      sponsor_chapter: 'Central Auckland Devotees',
      mass_sequence_number: 1,
    };

    assert.equal(mockEventWithRoster.presider_name, 'Fr. Mario Dorado, OFM');
    assert.equal(mockEventWithRoster.choir_name, 'Auckland Sinulog Choir');
    assert.equal(mockEventWithRoster.lectors?.length, 2);
    assert.equal(mockEventWithRoster.mass_sequence_number, 1);
  });
});

describe('formatCommunityPost Logic', () => {
  it('correctly aggregates reaction counts and detects user reaction', () => {
    const mockReactions: CommunityPostReaction[] = [
      {
        id: 'r1',
        post_id: 'p1',
        user_id: 'user-amen-1',
        reaction_type: 'amen',
        created_at: '2026-11-09T00:00:00Z',
      },
      {
        id: 'r2',
        post_id: 'p1',
        user_id: 'user-amen-2',
        reaction_type: 'amen',
        created_at: '2026-11-09T00:01:00Z',
      },
      {
        id: 'r3',
        post_id: 'p1',
        user_id: 'user-heart-1',
        reaction_type: 'heart',
        created_at: '2026-11-09T00:02:00Z',
      },
      {
        id: 'r4',
        post_id: 'p1',
        user_id: 'user-like-1',
        reaction_type: 'like',
        created_at: '2026-11-09T00:03:00Z',
      },
    ];

    const rawPost = {
      id: 'p1',
      author_id: 'author-1',
      post_type: 'prayer_request',
      content: 'Please pray for my mother recovery.',
      media_urls: [],
      youtube_video_id: null,
      intention_category: 'healing',
      announcement_type: null,
      event_id: null,
      visibility: 'public',
      is_pinned: false,
      is_hidden: false,
      created_at: '2026-11-09T00:00:00Z',
      updated_at: '2026-11-09T00:00:00Z',
      reactions: mockReactions,
      comments: [{ id: 'c1' }, { id: 'c2' }],
    };

    const formattedForAmenUser = formatCommunityPost(rawPost, 'user-amen-1');
    assert.deepEqual(formattedForAmenUser.reaction_counts, {
      amen: 2,
      heart: 1,
      like: 1,
      total: 4,
    });
    assert.equal(formattedForAmenUser.user_reaction, 'amen');
    assert.equal(formattedForAmenUser.comments_count, 2);

    const formattedForOtherUser = formatCommunityPost(rawPost, 'random-user');
    assert.equal(formattedForOtherUser.user_reaction, null);
    assert.equal(formattedForOtherUser.reaction_counts?.total, 4);

    const formattedNoUser = formatCommunityPost(rawPost, null);
    assert.equal(formattedNoUser.user_reaction, null);
  });

  it('handles posts with empty reactions and comments gracefully', () => {
    const rawPost = {
      id: 'p2',
      author_id: 'author-2',
      post_type: 'general',
      content: 'Viva Pit Señor!',
      media_urls: [],
      youtube_video_id: null,
      intention_category: null,
      announcement_type: null,
      event_id: null,
      visibility: 'public',
      is_pinned: true,
      is_hidden: false,
      created_at: '2026-11-09T00:00:00Z',
      updated_at: '2026-11-09T00:00:00Z',
    };

    const formatted = formatCommunityPost(rawPost);
    assert.deepEqual(formatted.reaction_counts, {
      amen: 0,
      heart: 0,
      like: 0,
      total: 0,
    });
    assert.equal(formatted.user_reaction, null);
    assert.equal(formatted.comments_count, 0);
  });
});

describe('Graceful Fallbacks without Backend/Network', () => {
  it('getFeedPosts returns an array without throwing unhandled rejection', async () => {
    const posts = await communityFeedApi.getFeedPosts();
    assert.ok(Array.isArray(posts));
  });

  it('getFeedPosts with filter options returns an array', async () => {
    const posts = await communityFeedApi.getFeedPosts({
      pinnedOnly: true,
      type: 'prayer_request',
      category: 'healing',
      limit: 5,
    });
    assert.ok(Array.isArray(posts));
  });

  it('getPostById returns null for missing or unreachable post without crashing', async () => {
    const post = await communityFeedApi.getPostById('non-existent-id');
    assert.equal(post, null);
  });

  it('getPostComments returns an array without crashing', async () => {
    const comments = await communityFeedApi.getPostComments('any-post-id');
    assert.ok(Array.isArray(comments));
  });

  it('toggleAmen returns { added: false, count: 0 } on unreachable client', async () => {
    const result = await communityFeedApi.toggleAmen('p1', 'u1');
    assert.deepEqual(result, { added: false, count: 0 });
  });

  it('badgesApi methods return arrays without crashing', async () => {
    const defs = await badgesApi.getAllBadgeDefinitions();
    assert.ok(Array.isArray(defs));

    const badges = await badgesApi.getUserBadges('user-1');
    assert.ok(Array.isArray(badges));

    const featured = await badgesApi.getUserFeaturedBadges('user-1');
    assert.ok(Array.isArray(featured));
  });

  it('novena progress methods return arrays without crashing', async () => {
    const progress = await novenasApi.getUserNovenaProgress('user-1', 2026);
    assert.ok(Array.isArray(progress));

    const progressViaAlias = await novenaProgressApi.getUserNovenaProgress('user-1');
    assert.ok(Array.isArray(progressViaAlias));
  });

  it('eventsApi getUpcomingEvents and getEventById return safe fallbacks', async () => {
    const events = await eventsApi.getUpcomingEvents(5);
    assert.ok(Array.isArray(events));

    const singleEvent = await eventsApi.getEventById('non-existent-event');
    assert.equal(singleEvent, null);
  });
});
