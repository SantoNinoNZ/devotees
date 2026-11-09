import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  compressImageToWebP,
  isAllowedImageFormat,
  formatBytes,
} from '../../src/utils/media';

describe('extractYouTubeVideoId', () => {
  it('extracts video ID from standard watch URLs', () => {
    assert.equal(
      extractYouTubeVideoId('https://www.youtube.com/watch?v=5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
    assert.equal(
      extractYouTubeVideoId('https://m.youtube.com/watch?v=5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
    assert.equal(
      extractYouTubeVideoId('http://youtube.com/watch?v=5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
  });

  it('extracts video ID from short URLs (youtu.be)', () => {
    assert.equal(
      extractYouTubeVideoId('https://youtu.be/5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
    assert.equal(
      extractYouTubeVideoId('https://youtu.be/5qap5aO4i9A?si=xyz123'),
      '5qap5aO4i9A'
    );
  });

  it('extracts video ID from YouTube Shorts URLs', () => {
    assert.equal(
      extractYouTubeVideoId('https://www.youtube.com/shorts/5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
    assert.equal(
      extractYouTubeVideoId('https://youtube.com/shorts/5qap5aO4i9A?feature=share'),
      '5qap5aO4i9A'
    );
  });

  it('extracts video ID from YouTube embed URLs', () => {
    assert.equal(
      extractYouTubeVideoId('https://www.youtube.com/embed/5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
    assert.equal(
      extractYouTubeVideoId('https://www.youtube-nocookie.com/embed/5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
  });

  it('handles query parameters cleanly', () => {
    assert.equal(
      extractYouTubeVideoId('https://www.youtube.com/watch?v=5qap5aO4i9A&t=10s&feature=shared'),
      '5qap5aO4i9A'
    );
    assert.equal(
      extractYouTubeVideoId('https://www.youtube.com/watch?feature=shared&v=5qap5aO4i9A'),
      '5qap5aO4i9A'
    );
  });

  it('returns null on invalid or non-YouTube URLs', () => {
    assert.equal(extractYouTubeVideoId(''), null);
    assert.equal(extractYouTubeVideoId('not-a-url'), null);
    assert.equal(extractYouTubeVideoId('https://vimeo.com/12345678'), null);
    assert.equal(extractYouTubeVideoId('https://google.com'), null);
    assert.equal(extractYouTubeVideoId('https://www.youtube.com'), null);
    assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch'), null);
    assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v='), null);
  });
});

describe('getYouTubeEmbedUrl', () => {
  it('returns privacy-enhanced embed URL', () => {
    assert.equal(
      getYouTubeEmbedUrl('5qap5aO4i9A'),
      'https://www.youtube-nocookie.com/embed/5qap5aO4i9A'
    );
  });
});

describe('isAllowedImageFormat', () => {
  it('accepts valid image MIME types', () => {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
    ];

    for (const type of validTypes) {
      const file = new File(['dummy'], `test.${type.split('/')[1]}`, { type });
      assert.equal(isAllowedImageFormat(file), true, `Expected ${type} to be allowed`);
    }
  });

  it('rejects unsupported file formats', () => {
    const invalidTypes = [
      'application/pdf',
      'video/mp4',
      'text/plain',
      'image/svg+xml',
      'application/octet-stream',
    ];

    for (const type of invalidTypes) {
      const file = new File(['dummy'], `test`, { type });
      assert.equal(isAllowedImageFormat(file), false, `Expected ${type} to be rejected`);
    }
  });
});

describe('formatBytes', () => {
  it('formats bytes into human readable strings', () => {
    assert.equal(formatBytes(0), '0 Bytes');
    assert.equal(formatBytes(500), '500 Bytes');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(1024 * 1024), '1 MB');
    assert.equal(formatBytes(1024 * 1024 * 2.5), '2.5 MB');
  });
});

describe('compressImageToWebP', () => {
  it('gracefully returns original blob or handles gracefully in non-browser environment', async () => {
    const blob = new Blob(['sample-data'], { type: 'image/png' });
    const result = await compressImageToWebP(blob);
    assert.ok(result instanceof Blob);
  });
});
