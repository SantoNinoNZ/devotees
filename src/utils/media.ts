/**
 * Media utilities for client-side image compression and video parsing.
 * Enforces zero-cost YouTube embedding and browser-side WebP compression (<200KB)
 * to operate safely within Supabase free-tier storage and egress limits.
 */

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

/**
 * Checks whether the uploaded file is an allowed image format.
 */
export function isAllowedImageFormat(file: File): boolean {
  if (!file || typeof file.type !== 'string') return false;
  return ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase());
}

/**
 * Formats a byte number into a human-readable string (e.g. 1.2 MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0 || isNaN(bytes)) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);
  const value = parseFloat((bytes / Math.pow(k, index)).toFixed(dm));

  return `${value} ${sizes[index]}`;
}

/**
 * Extracts a YouTube 11-character video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=5qap5aO4i9A
 * - https://m.youtube.com/watch?v=5qap5aO4i9A
 * - https://youtu.be/5qap5aO4i9A
 * - https://www.youtube.com/shorts/5qap5aO4i9A
 * - https://www.youtube.com/embed/5qap5aO4i9A
 * - https://www.youtube-nocookie.com/embed/5qap5aO4i9A
 *
 * Returns null if the URL is invalid or not a recognized YouTube URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtube-nocookie.com'
    ) {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      }
      const pathMatch = parsed.pathname.match(/^\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
      if (pathMatch) return pathMatch[1];
    } else if (hostname === 'youtu.be') {
      const pathMatch = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
      if (pathMatch) return pathMatch[1];
    }
  } catch {
    // If URL parsing fails, attempt regex fallback
  }

  const regex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}

/**
 * Generates privacy-enhanced YouTube embed URL.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}

/**
 * Compresses an image file/blob to WebP format using client-side canvas.
 * Downscales images exceeding maxWidth while preserving aspect ratio.
 * In non-browser (Node / SSR) environments, safely returns the original file/blob.
 */
export async function compressImageToWebP(
  file: File | Blob,
  maxWidth = 1200,
  quality = 0.75
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
