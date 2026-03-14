// YouTube Data API v3 service
// Requires: YOUTUBE_API_KEY environment variable

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export const youtubeEnabled = () => !!YOUTUBE_API_KEY;

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
}

export interface YouTubeLiveStream {
  streamId: string;
  channelId: string;
  embedUrl: string;
  isLive: boolean;
}

// Build embed URL for a YouTube video or live stream
export function buildYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  rel?: boolean;
}): string {
  const params = new URLSearchParams({
    rel: options?.rel ? "1" : "0",
    modestbranding: "1",
    ...(options?.autoplay ? { autoplay: "1" } : {}),
    ...(options?.mute ? { mute: "1" } : {}),
    ...(options?.controls === false ? { controls: "0" } : {}),
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

// Build embed URL for a YouTube Live stream by channel ID
export function buildYouTubeLiveEmbedUrl(channelId: string): string {
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}&rel=0&modestbranding=1`;
}

// Extract YouTube video ID from a URL
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract YouTube Stream / Channel ID from URL
export function extractYouTubeStreamId(url: string): { type: "video" | "channel" | "id"; id: string } | null {
  // Direct video ID
  const videoId = extractYouTubeVideoId(url);
  if (videoId) return { type: "video", id: videoId };

  // Channel ID
  const channelMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelMatch) return { type: "channel", id: channelMatch[1] };

  // Channel @handle — return as-is for display
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) return { type: "channel", id: handleMatch[1] };

  // Raw ID
  if (/^[a-zA-Z0-9_-]{11,24}$/.test(url.trim())) {
    return { type: "id", id: url.trim() };
  }

  return null;
}

// Search YouTube videos (requires API key)
export async function searchYouTubeVideos(query: string, maxResults = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key not configured (YOUTUBE_API_KEY)");
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    relevanceLanguage: "es",
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube API error: ${err}`);
  }

  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

// Get YouTube video details (requires API key)
export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) return null;

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoId,
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails?.duration,
  };
}

// Check if a YouTube Live stream is currently active (requires API key)
export async function checkYouTubeLiveStatus(channelId: string): Promise<boolean> {
  if (!YOUTUBE_API_KEY) return false;

  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    eventType: "live",
    type: "video",
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
  if (!res.ok) return false;

  const data = await res.json();
  return (data.items?.length ?? 0) > 0;
}
