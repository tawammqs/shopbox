export type VideoType = "upload" | "mp4" | "youtube";

export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function getYoutubeEmbed(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export const VIDEO_UPLOAD_MAX_BYTES = 100 * 1024 * 1024; // 100MB
export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm";
export const VIDEO_ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
