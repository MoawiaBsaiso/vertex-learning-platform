import {
  CHUNK_WINDOW_SECONDS,
  MAX_CHUNK_CHARS,
  MAX_CHUNK_TEXT_LENGTH,
} from './constants'

export type TranscriptSegment = {
  text: string
  offset: number
  duration?: number
  lang?: string
}

export type TranscriptChunk = {
  startSeconds: number
  text: string
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitLongText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) {
    return [text]
  }

  const pieces: string[] = []
  let remaining = text

  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf(' ', maxChars)

    if (cut < maxChars / 2) {
      cut = maxChars
    }

    pieces.push(remaining.slice(0, cut).trim())
    remaining = remaining.slice(cut).trim()
  }

  if (remaining) {
    pieces.push(remaining)
  }

  return pieces.filter(Boolean)
}

export function segmentsToChunks(
  segments: TranscriptSegment[],
  windowSeconds = CHUNK_WINDOW_SECONDS,
  maxChars = Math.min(MAX_CHUNK_CHARS, MAX_CHUNK_TEXT_LENGTH - 1),
): TranscriptChunk[] {
  const prepared = segments
    .filter(
      (segment) =>
        segment &&
        typeof segment.text === 'string' &&
        typeof segment.offset === 'number' &&
        Number.isFinite(segment.offset),
    )
    .map((segment) => ({
      startSeconds: Math.max(0, Math.floor(segment.offset)),
      text: cleanText(segment.text),
    }))
    .filter((segment) => segment.text.length > 0)
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .flatMap((segment) =>
      splitLongText(segment.text, maxChars).map((text) => ({
        startSeconds: segment.startSeconds,
        text,
      })),
    )

  const chunks: TranscriptChunk[] = []
  let current: { startSeconds: number; parts: string[]; chars: number } | null =
    null
  let lastStart = -1

  for (const segment of prepared) {
    if (!current) {
      current = {
        startSeconds: segment.startSeconds,
        parts: [segment.text],
        chars: segment.text.length,
      }
      continue
    }

    const windowExceeded =
      segment.startSeconds >= current.startSeconds + windowSeconds
    const sizeExceeded =
      current.chars + 1 + segment.text.length > maxChars

    if (windowExceeded || sizeExceeded) {
      const text = current.parts.join(' ').trim()

      if (text) {
        chunks.push({ startSeconds: current.startSeconds, text })
        lastStart = Math.max(lastStart, current.startSeconds)
      }

      current = {
        startSeconds: Math.max(segment.startSeconds, lastStart + 1),
        parts: [segment.text],
        chars: segment.text.length,
      }
    } else {
      current.parts.push(segment.text)
      current.chars += 1 + segment.text.length
    }
  }

  if (current) {
    const text = current.parts.join(' ').trim()

    if (text) {
      chunks.push({ startSeconds: current.startSeconds, text })
    }
  }

  return chunks
}
