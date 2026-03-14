// Google Drive integration service
// For public files: no API key needed (iframe embed)
// For private files: requires Google OAuth (connector setup)

export const driveEnabled = () => !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export interface DriveFile {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  size?: string;
}

// Extract Google Drive file ID from a share URL
export function extractDriveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{25,50})$/, // Raw file ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Build embed URL for a public Google Drive file
export function buildDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// Build embed URL for Google Docs (documents, sheets, slides)
export function buildGDocsEmbedUrl(url: string): string {
  // Docs: https://docs.google.com/document/d/{id}/preview
  // Sheets: https://docs.google.com/spreadsheets/d/{id}/preview
  // Slides: https://docs.google.com/presentation/d/{id}/embed
  const docMatch = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) {
    const [, type, id] = docMatch;
    if (type === "presentation") return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`;
    return `https://docs.google.com/${type}/d/${id}/preview`;
  }

  const fileId = extractDriveFileId(url);
  if (fileId) return buildDriveEmbedUrl(fileId);

  return url;
}

// Get the Drive resource type based on URL
export type DriveResourceType = "document" | "spreadsheet" | "presentation" | "video" | "image" | "pdf" | "file";

export function getDriveResourceType(url: string): DriveResourceType {
  if (url.includes("docs.google.com/document")) return "document";
  if (url.includes("docs.google.com/spreadsheets")) return "spreadsheet";
  if (url.includes("docs.google.com/presentation")) return "presentation";
  if (url.match(/\.(mp4|mov|avi|webm)(\?|$)/i)) return "video";
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return "image";
  if (url.match(/\.pdf(\?|$)/i)) return "pdf";
  return "file";
}

// Build an embed URL for any Drive/Google Docs URL
export function buildEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
    return buildGDocsEmbedUrl(url);
  }
  return url;
}

// Validate that a URL is a supported Google Drive/Docs URL
export function isValidDriveUrl(url: string): boolean {
  return (
    url.includes("drive.google.com") ||
    url.includes("docs.google.com") ||
    url.includes("slides.google.com")
  );
}

// List files in a folder (requires OAuth / service account — for future implementation)
export async function listDriveFolder(_folderId: string): Promise<DriveFile[]> {
  if (!driveEnabled()) {
    throw new Error("Google Drive OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }
  // Placeholder for full OAuth implementation via Replit connector
  return [];
}
