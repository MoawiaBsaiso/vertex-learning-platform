const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

function extractYoutubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? id : null;
  }

  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v");
    return id ? id : null;
  }

  for (const prefix of ["/embed/", "/shorts/", "/v/"]) {
    if (url.pathname.startsWith(prefix)) {
      const id = url.pathname.slice(prefix.length).split("/")[0];
      return id ? id : null;
    }
  }

  return null;
}

function extractVimeoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();

  if (!VIMEO_HOSTS.has(host)) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const candidate = parts[0] === "video" ? parts[1] : parts[0];

  return candidate && /^\d+$/.test(candidate) ? candidate : null;
}

function normalizeStart(startSeconds: number | null | undefined): number | null {
  if (typeof startSeconds !== "number" || !Number.isFinite(startSeconds)) {
    return null;
  }

  const floored = Math.floor(startSeconds);
  return floored > 0 ? floored : null;
}

export function buildVideoEmbed(
  videoUrl: string,
  startSeconds?: number | null,
): string | null {
  let url: URL;

  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  const start = normalizeStart(startSeconds);

  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    const params = new URLSearchParams({ rel: "0" });
    if (start !== null) {
      params.set("start", String(start));
    }
    return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    const params = start !== null ? `?t=${start}` : "";
    return `https://player.vimeo.com/video/${vimeoId}${params}`;
  }

  if (url.hostname.toLowerCase() === "iframe.mediadelivery.net") {
    if (!url.pathname.startsWith("/embed/")) {
      return null;
    }
    const params = url.search ? `?${url.searchParams.toString()}` : "";
    return `https://iframe.mediadelivery.net${url.pathname}${params}`;
  }

  return null;
}
