/**
 * Parses a video URL and returns embed info.
 * Supports: YouTube, YouTube Shorts, Vimeo, Google Drive, direct MP4.
 */
export type VideoType = 'youtube' | 'vimeo' | 'gdrive' | 'mp4' | 'unknown';

export interface VideoEmbed {
  type: VideoType;
  embedUrl: string;
}

export function parseVideoUrl(url: string): VideoEmbed | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  // YouTube standard + shorts
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Google Drive file
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch) {
    return { type: 'gdrive', embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview` };
  }

  // Direct MP4
  if (trimmed.match(/\.mp4(\?.*)?$/i)) {
    return { type: 'mp4', embedUrl: trimmed };
  }

  return null;
}
