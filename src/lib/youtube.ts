const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function normalizeUrl(input: string): URL | null {
  const value = input.trim();

  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

function isValidVideoId(value: string | null): value is string {
  return value !== null && VIDEO_ID_PATTERN.test(value);
}

export function extractYouTubeVideoId(input: string): string | null {
  const url = normalizeUrl(input);

  if (!url) {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (hostname === "youtu.be") {
    return isValidVideoId(pathParts[0] ?? null) ? pathParts[0] : null;
  }

  const isYouTubeHost =
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtube-nocookie.com" ||
    hostname.endsWith(".youtube-nocookie.com");

  if (!isYouTubeHost) {
    return null;
  }

  const watchVideoId = url.searchParams.get("v");
  if (isValidVideoId(watchVideoId)) {
    return watchVideoId;
  }

  if (["embed", "v", "shorts", "live"].includes(pathParts[0])) {
    const pathVideoId = pathParts[1] ?? null;
    return isValidVideoId(pathVideoId) ? pathVideoId : null;
  }

  return null;
}

export function looksLikeUrl(input: string): boolean {
  const value = input.trim();
  return (
    /^https?:\/\//i.test(value) ||
    /^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(value)
  );
}
