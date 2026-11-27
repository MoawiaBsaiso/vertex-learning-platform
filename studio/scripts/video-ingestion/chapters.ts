import { readFile } from 'node:fs/promises'

import { WATCH_PAGE_TIMEOUT_MS } from './constants'

export type Chapter = {
  startSeconds: number
  label: string
}

export type ChapterSource = 'description' | 'watch-page' | 'manifest' | 'none'

export type ChapterResolution = {
  chapters: Chapter[]
  source: ChapterSource
  warning?: string
}

function timestampToSeconds(value: string): number | null {
  const parts = value.split(':').map((part) => Number(part))

  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part))) {
    return null
  }

  let seconds = 0
  for (const part of parts) {
    seconds = seconds * 60 + part
  }

  return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : null
}

function cleanLabel(value: string, maxLength: number): string {
  return value
    .replace(/^[\s\-–—:*•]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function normalizeChapters(
  items: Array<{ startSeconds: number; label: string }>,
  maxLabelLength = 160,
): Chapter[] {
  const sorted = items
    .map((item) => ({
      startSeconds: Math.floor(item.startSeconds),
      label: cleanLabel(item.label, maxLabelLength),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.startSeconds) &&
        item.startSeconds >= 0 &&
        item.label.length > 0,
    )
    .sort((a, b) => a.startSeconds - b.startSeconds)

  const seen = new Set<number>()
  const chapters: Chapter[] = []

  for (const item of sorted) {
    if (seen.has(item.startSeconds)) {
      continue
    }

    seen.add(item.startSeconds)
    chapters.push(item)
  }

  return chapters
}

export function parseDescriptionChapters(
  description: string | null | undefined,
): Chapter[] {
  if (!description) {
    return []
  }

  const pattern =
    /^\s*(?:[-*•]\s*)?((?:\d{1,2}:)?\d{1,2}:\d{2})\s*[-–—:.]?\s*(.+?)\s*$/
  const chapters: Chapter[] = []

  for (const line of description.split(/\r?\n/)) {
    const match = pattern.exec(line)

    if (!match) {
      continue
    }

    const startSeconds = timestampToSeconds(match[1])

    if (startSeconds === null) {
      continue
    }

    chapters.push({
      startSeconds,
      label: cleanLabel(match[2], 160),
    })
  }

  return normalizeChapters(chapters)
}

function extractJsonObject(html: string, marker: string): string | null {
  const markerIndex = html.indexOf(marker)

  if (markerIndex < 0) {
    return null
  }

  const equalsIndex = html.indexOf('=', markerIndex + marker.length)

  if (equalsIndex < 0) {
    return null
  }

  let index = equalsIndex + 1

  while (index < html.length && /\s/.test(html[index])) {
    index += 1
  }

  if (html[index] !== '{') {
    return null
  }

  const start = index
  let depth = 0
  let inString = false
  let escaped = false

  for (; index < html.length; index += 1) {
    const char = html[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }

      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return html.slice(start, index + 1)
      }
    }
  }

  return null
}

function textFromTitle(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return ''
  }

  const title = value as Record<string, unknown>

  if (typeof title.simpleText === 'string') {
    return title.simpleText
  }

  if (Array.isArray(title.runs)) {
    return title.runs
      .map((run) =>
        run && typeof run === 'object' && typeof run.text === 'string'
          ? run.text
          : '',
      )
      .join('')
  }

  return ''
}

function collectRendererChapters(node: unknown, chapters: Chapter[]): void {
  if (!node || typeof node !== 'object') {
    return
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectRendererChapters(item, chapters)
    }

    return
  }

  const object = node as Record<string, unknown>

  for (const key of ['chapterRenderer', 'macroMarkersListItemRenderer']) {
    const renderer = object[key]

    if (!renderer || typeof renderer !== 'object') {
      continue
    }

    const entry = renderer as Record<string, unknown>
    const rawMillis =
      entry.timeRangeStartMillis ?? entry.timeRangeStartMillisText
    const millis = Number(rawMillis)

    if (Number.isFinite(millis) && millis >= 0) {
      const label = textFromTitle(entry.title ?? entry.titleText)

      if (label.trim()) {
        chapters.push({
          startSeconds: Math.floor(millis / 1000),
          label,
        })
      }
    }
  }

  for (const value of Object.values(object)) {
    collectRendererChapters(value, chapters)
  }
}

export function parseWatchPageChapters(html: string): Chapter[] {
  const json = extractJsonObject(html, 'ytInitialData')

  if (!json) {
    return []
  }

  let data: unknown

  try {
    data = JSON.parse(json)
  } catch {
    return []
  }

  const chapters: Chapter[] = []
  collectRendererChapters(data, chapters)

  return normalizeChapters(chapters)
}

async function fetchWatchPage(videoId: string): Promise<string> {
  const response = await fetch(
    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
    {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(WATCH_PAGE_TIMEOUT_MS),
    },
  )

  if (!response.ok) {
    throw new Error(`YouTube watch page returned ${response.status}`)
  }

  return response.text()
}

export async function loadChapterManifest(
  manifestPath: string,
): Promise<Record<string, Chapter[]>> {
  let raw: string

  try {
    raw = await readFile(manifestPath, 'utf8')
  } catch {
    return {}
  }

  const parsed: unknown = JSON.parse(raw)

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {}
  }

  const manifest: Record<string, Chapter[]> = {}

  for (const [key, value] of Object.entries(parsed)) {
    if (!Array.isArray(value)) {
      continue
    }

    manifest[key] = normalizeChapters(
      value.filter(
        (item): item is Chapter =>
          Boolean(
            item &&
              typeof item === 'object' &&
              typeof item.startSeconds === 'number' &&
              typeof item.label === 'string',
          ),
      ),
    )
  }

  return manifest
}

function shortReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 300)
}

export async function resolveChapters(options: {
  videoId: string
  description: string | null | undefined
  manifestPath: string
  fetchHtml?: (videoId: string) => Promise<string>
}): Promise<ChapterResolution> {
  const fromDescription = parseDescriptionChapters(options.description)

  if (fromDescription.length >= 2) {
    return { chapters: fromDescription, source: 'description' }
  }

  let warning: string | undefined

  try {
    const html = await (options.fetchHtml ?? fetchWatchPage)(options.videoId)
    const fromWatchPage = parseWatchPageChapters(html)

    if (fromWatchPage.length > 0) {
      return { chapters: fromWatchPage, source: 'watch-page', warning }
    }
  } catch (error) {
    warning = `watch-page chapter fallback failed: ${shortReason(error)}`
  }

  try {
    const manifest = await loadChapterManifest(options.manifestPath)
    const authored = manifest[options.videoId] ?? []

    if (authored.length > 0) {
      return { chapters: authored, source: 'manifest', warning }
    }
  } catch (error) {
    warning = `${warning ? `${warning}; ` : ''}chapter manifest failed: ${shortReason(error)}`
  }

  return { chapters: [], source: 'none', warning }
}
