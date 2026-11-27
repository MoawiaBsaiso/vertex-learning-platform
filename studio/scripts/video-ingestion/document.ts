import { createHash } from 'node:crypto'

import type { Chapter } from './chapters'
import type { TranscriptChunk } from './chunks'
import {
  MAX_CHAPTER_LABEL_LENGTH,
  MAX_CHUNK_TEXT_LENGTH,
} from './constants'
import type { Provider } from './providers'

export type VideoChapterItem = Chapter & {
  _type: 'videoChapter'
  _key: string
}

export type VideoChunkItem = TranscriptChunk & {
  _type: 'videoChunk'
  _key: string
}

export type VideoDocument = {
  _id: string
  _type: 'video'
  id: string
  url: string
  chapters: VideoChapterItem[]
  chunks: VideoChunkItem[]
}

function hash(value: string): string {
  return createHash('sha1').update(value).digest('hex')
}

export function sanitizeSanityId(raw: string, hashSource = raw): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120)
    .replace(/[-.]+$/g, '')

  if (!cleaned) {
    return `video-${hash(hashSource).slice(0, 8)}`
  }

  if (cleaned === raw) {
    return cleaned
  }

  return `${cleaned}-${hash(hashSource).slice(0, 8)}`
}

export function videoDocumentId(
  provider: Provider,
  videoId: string,
  url: string,
): string {
  return sanitizeSanityId(`video-${provider}-${videoId}`, url)
}

function validateSequence(
  items: Array<{ startSeconds: number }>,
  name: string,
): string[] {
  const errors: string[] = []
  let previous = -1

  items.forEach((item, index) => {
    const path = `${name}[${index}]`

    if (!Number.isInteger(item.startSeconds) || item.startSeconds < 0) {
      errors.push(`${path}.startSeconds must be a non-negative integer`)
      return
    }

    if (item.startSeconds <= previous) {
      errors.push(`${path}.startSeconds must be greater than the previous start`)
      return
    }

    previous = item.startSeconds
  })

  return errors
}

export function buildVideoDocument(options: {
  provider: Provider
  videoId: string
  url: string
  chapters: Chapter[]
  chunks: TranscriptChunk[]
}): VideoDocument {
  return {
    _id: videoDocumentId(options.provider, options.videoId, options.url),
    _type: 'video',
    id: options.videoId,
    url: options.url,
    chapters: options.chapters.map((chapter) => ({
      _type: 'videoChapter',
      _key: `h${chapter.startSeconds}`,
      startSeconds: chapter.startSeconds,
      label: chapter.label,
    })),
    chunks: options.chunks.map((chunk) => ({
      _type: 'videoChunk',
      _key: `c${chunk.startSeconds}`,
      startSeconds: chunk.startSeconds,
      text: chunk.text,
    })),
  }
}

export function validateVideoDocument(document: VideoDocument): string[] {
  const errors: string[] = []

  if (!document._id || document._id.length > 128) {
    errors.push('_id is missing or too long')
  }

  if (document._type !== 'video') {
    errors.push('_type must be "video"')
  }

  if (
    typeof document.id !== 'string' ||
    document.id.length < 1 ||
    document.id.length > 240
  ) {
    errors.push('id must be a non-empty string of at most 240 characters')
  }

  try {
    const url = new URL(document.url)

    if (!['http:', 'https:'].includes(url.protocol)) {
      errors.push('url must use http or https')
    }
  } catch {
    errors.push('url must be a valid URL')
  }

  errors.push(...validateSequence(document.chapters, 'chapters'))

  document.chapters.forEach((chapter, index) => {
    if (
      typeof chapter.label !== 'string' ||
      chapter.label.trim().length < 1 ||
      chapter.label.length > MAX_CHAPTER_LABEL_LENGTH
    ) {
      errors.push(`chapters[${index}].label is empty or too long`)
    }
  })

  errors.push(...validateSequence(document.chunks, 'chunks'))

  if (document.chunks.length < 1) {
    errors.push('chunks must contain at least one transcript chunk')
  }

  document.chunks.forEach((chunk, index) => {
    if (
      typeof chunk.text !== 'string' ||
      chunk.text.trim().length < 1 ||
      chunk.text.length > MAX_CHUNK_TEXT_LENGTH
    ) {
      errors.push(`chunks[${index}].text is empty or too long`)
    }
  })

  return errors
}
