import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateComposerForm,
  buildPostPayload,
  getComposerModalTitle,
  PRAYER_INTENTION_CATEGORIES,
} from '../../src/components/feed/PostComposerModal';

describe('PostComposerModal - Form Validation', () => {
  it('rejects an empty form with no text, photos, or video link', () => {
    const result = validateComposerForm({
      content: '',
      youtubeUrl: '',
      mediaUrls: [],
    });
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /Please write a message, paste a YouTube link, or attach a photo/i);
  });

  it('rejects whitespace-only text content when no media is attached', () => {
    const result = validateComposerForm({
      content: '   \n  \t  ',
      youtubeUrl: '',
      mediaUrls: [],
    });
    assert.equal(result.isValid, false);
  });

  it('accepts valid text-only reflection', () => {
    const result = validateComposerForm({
      content: 'Viva Pit Señor! Santo Niño, bless our Auckland parish community.',
    });
    assert.equal(result.isValid, true);
    assert.equal(result.error, undefined);
  });

  it('accepts posts with photos even if text content is empty', () => {
    const result = validateComposerForm({
      content: '',
      photoCount: 2,
    });
    assert.equal(result.isValid, true);
  });

  it('accepts posts with photos specified via mediaUrls', () => {
    const result = validateComposerForm({
      content: '',
      mediaUrls: ['data:image/webp;base64,sample1', 'data:image/webp;base64,sample2'],
    });
    assert.equal(result.isValid, true);
  });

  it('rejects posts exceeding the 4-photo maximum limit', () => {
    const resultByCount = validateComposerForm({
      content: 'Festival photos',
      photoCount: 5,
    });
    assert.equal(resultByCount.isValid, false);
    assert.match(resultByCount.error || '', /maximum of 4 photos/i);

    const resultByUrls = validateComposerForm({
      content: 'Festival photos',
      mediaUrls: ['url1', 'url2', 'url3', 'url4', 'url5'],
    });
    assert.equal(resultByUrls.isValid, false);
    assert.match(resultByUrls.error || '', /maximum of 4 photos/i);
  });

  it('accepts valid YouTube URLs even without text content', () => {
    const result = validateComposerForm({
      content: '',
      youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    });
    assert.equal(result.isValid, true);
  });

  it('accepts valid YouTube Shorts URLs', () => {
    const result = validateComposerForm({
      content: 'Sinulog practice highlights',
      youtubeUrl: 'https://youtube.com/shorts/5qap5aO4i9A',
    });
    assert.equal(result.isValid, true);
  });

  it('rejects invalid or malformed YouTube URLs', () => {
    const result = validateComposerForm({
      content: 'Check out this video',
      youtubeUrl: 'https://vimeo.com/12345678',
    });
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /valid YouTube or Shorts link/i);
  });
});

describe('PostComposerModal - Payload Construction', () => {
  it('constructs a standard general reflection post payload', () => {
    const payload = buildPostPayload({
      authorId: 'devotee-123',
      content: 'Viva Señor Santo Niño! Thank you for the blessings.',
      mode: 'general',
    });

    assert.equal(payload.author_id, 'devotee-123');
    assert.equal(payload.content, 'Viva Señor Santo Niño! Thank you for the blessings.');
    assert.equal(payload.post_type, 'general');
    assert.equal(payload.intention_category, null);
    assert.equal(payload.youtube_video_id, null);
    assert.deepEqual(payload.media_urls, []);
    assert.equal(payload.visibility, 'public');
    assert.equal(payload.is_pinned, false);
    assert.equal(payload.is_hidden, false);
  });

  it('trims leading and trailing whitespace from content', () => {
    const payload = buildPostPayload({
      authorId: 'devotee-123',
      content: '   Blessed novena evening everyone!   \n',
    });

    assert.equal(payload.content, 'Blessed novena evening everyone!');
  });

  it('supports Hermanos Only privacy visibility', () => {
    const payload = buildPostPayload({
      authorId: 'hermano-coordinator',
      content: 'Internal reminder for altar servers.',
      visibility: 'hermanos_only',
    });

    assert.equal(payload.visibility, 'hermanos_only');
  });

  it('constructs a prayer intention post with healing category', () => {
    const payload = buildPostPayload({
      authorId: 'devotee-456',
      content: 'Please pray for Tito Danilo undergoing heart surgery tomorrow.',
      mode: 'prayer',
      category: 'healing',
    });

    assert.equal(payload.post_type, 'prayer_request');
    assert.equal(payload.intention_category, 'healing');
  });

  it('constructs prayer intentions for all four liturgical categories', () => {
    const categories = ['healing', 'thanksgiving', 'special', 'repose'] as const;

    for (const cat of categories) {
      const payload = buildPostPayload({
        authorId: 'devotee-456',
        content: `Supplication for ${cat}`,
        category: cat,
      });

      assert.equal(payload.post_type, 'prayer_request');
      assert.equal(payload.intention_category, cat);
    }
  });

  it('defaults prayer intention category to special if not specified', () => {
    const payload = buildPostPayload({
      authorId: 'devotee-789',
      content: 'Prayers for safe travels to Cebu.',
      mode: 'prayer',
      category: null,
    });

    assert.equal(payload.post_type, 'prayer_request');
    assert.equal(payload.intention_category, 'special');
  });

  it('constructs a YouTube video post payload and extracts video ID from standard URL', () => {
    const payload = buildPostPayload({
      authorId: 'devotee-123',
      content: 'Sinulog 2026 rehearsal recap video',
      youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    });

    assert.equal(payload.youtube_video_id, '5qap5aO4i9A');
    assert.equal(payload.post_type, 'general');
  });

  it('extracts YouTube ID from youtu.be short URL and Shorts URL', () => {
    const payloadShort = buildPostPayload({
      authorId: 'devotee-123',
      content: 'Short link test',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });
    assert.equal(payloadShort.youtube_video_id, 'dQw4w9WgXcQ');

    const payloadShorts = buildPostPayload({
      authorId: 'devotee-123',
      content: 'Shorts test',
      youtubeUrl: 'https://youtube.com/shorts/dQw4w9WgXcQ?feature=share',
    });
    assert.equal(payloadShorts.youtube_video_id, 'dQw4w9WgXcQ');
  });

  it('constructs a photo post payload with media URLs attached', () => {
    const photos = [
      'data:image/webp;base64,AAA123',
      'data:image/webp;base64,BBB456',
    ];

    const payload = buildPostPayload({
      authorId: 'devotee-123',
      content: 'Photos from today’s novena mass in Henderson',
      mediaUrls: photos,
    });

    assert.deepEqual(payload.media_urls, photos);
    assert.equal(payload.media_urls.length, 2);
  });
});

describe('PostComposerModal - Category Mappings', () => {
  it('defines all 4 core devotional intention categories', () => {
    const categoryIds = PRAYER_INTENTION_CATEGORIES.map((c) => c.id);
    assert.deepEqual(categoryIds, ['healing', 'thanksgiving', 'special', 'repose']);
  });

  it('ensures each category has complete liturgical metadata and emojis', () => {
    for (const cat of PRAYER_INTENTION_CATEGORIES) {
      assert.ok(cat.id, 'Category must have an id');
      assert.ok(cat.label, 'Category must have a label');
      assert.ok(cat.icon, 'Category must have an icon emoji');
      assert.ok(cat.description, 'Category must have a description');
      assert.ok(cat.badgeClass, 'Category must have a Tailwind badge class');
    }

    const icons = PRAYER_INTENTION_CATEGORIES.map((c) => c.icon);
    assert.deepEqual(icons, ['🙏', '🎉', '✨', '🕊️']);
  });
});

describe('PostComposerModal - Title Resolution', () => {
  it('returns appropriate title according to active mode', () => {
    assert.equal(getComposerModalTitle('general'), 'Share with Community');
    assert.equal(getComposerModalTitle('video'), 'Share YouTube Video with Community');
    assert.equal(getComposerModalTitle('photo'), 'Add Photos (WebP Compressed)');
    assert.equal(getComposerModalTitle('prayer'), 'Submit Community Prayer Intention');
  });

  it('returns prayer title if intention category is active even in general mode', () => {
    assert.equal(
      getComposerModalTitle('general', 'healing'),
      'Submit Community Prayer Intention'
    );
  });
});
