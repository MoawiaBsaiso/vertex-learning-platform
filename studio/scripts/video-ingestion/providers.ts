export type Provider = 'youtube' | 'vimeo' | 'bunny' | 'unsupported'

export type VideoReference = {
  provider: Provider
  videoId: string
  url: string
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

const VIMEO_HOSTS = new Set([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
])

const BUNNY_HOSTS = new Set([
  'iframe.mediadelivery.net',
  'video.bunnycdn.com',
  'b-cdn.net',
])

function isBunnyHost(hostname: string): boolean {
  return BUNNY_HOSTS.has(hostname) || hostname.endsWith('.b-cdn.net')
}

function extractYoutubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase()

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const candidate = url.pathname.slice(1).split('/')[0]
    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null
  }

  if (!YOUTUBE_HOSTS.has(host)) {
    return null
  }

  if (url.pathname === '/watch') {
    const candidate = url.searchParams.get('v')
    return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate)
      ? candidate
      : null
  }

  for (const prefix of ['/embed/', '/shorts/', '/v/']) {
    if (url.pathname.startsWith(prefix)) {
      const candidate = url.pathname.slice(prefix.length).split('/')[0]
      if (/^[A-Za-z0-9_-]{11}$/.test(candidate)) {
        return candidate
      }
    }
  }

  return null
}

function extractVimeoId(url: URL): string | null {
  if (!VIMEO_HOSTS.has(url.hostname.toLowerCase())) {
    return null
  }

  const parts = url.pathname.split('/').filter(Boolean)
  const candidate = parts[0] === 'video' ? parts[1] : parts[0]

  return candidate && /^\d+$/.test(candidate) ? candidate : null
}

function extractBunnyId(url: URL): string | null {
  if (!isBunnyHost(url.hostname.toLowerCase())) {
    return null
  }

  const parts = url.pathname.split('/').filter(Boolean)
  const embedIndex = parts.indexOf('embed')

  if (embedIndex >= 0 && parts[embedIndex + 1]) {
    return parts[embedIndex + 1]
  }

  return parts[0] ?? null
}

export function detectProvider(url: string): Provider {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return 'unsupported'
  }

  const hostname = parsed.hostname.toLowerCase()

  if (YOUTUBE_HOSTS.has(hostname) && extractYoutubeId(parsed)) {
    return 'youtube'
  }

  if (VIMEO_HOSTS.has(hostname) && extractVimeoId(parsed)) {
    return 'vimeo'
  }

  if (isBunnyHost(hostname) && extractBunnyId(parsed)) {
    return 'bunny'
  }

  return 'unsupported'
}

export function parseVideoReference(url: string): VideoReference | null {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return null
  }

  const provider = detectProvider(url)

  if (provider === 'youtube') {
    const videoId = extractYoutubeId(parsed)
    return videoId ? { provider, videoId, url } : null
  }

  if (provider === 'vimeo') {
    const videoId = extractVimeoId(parsed)
    return videoId ? { provider, videoId, url } : null
  }

  if (provider === 'bunny') {
    const videoId = extractBunnyId(parsed)
    return videoId ? { provider, videoId, url } : null
  }

  return { provider, videoId: '', url }
}
