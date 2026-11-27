import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchTranscript } from 'youtube-transcript-plus'

import {
  countVideoDocuments,
  getLessonVideoUrls,
  upsertVideo,
} from './client'
import { resolveChapters, type ChapterSource } from './chapters'
import { segmentsToChunks } from './chunks'
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_LANG,
  MAX_CONCURRENCY,
} from './constants'
import { chapterManifestPath, rawDir, reportPath } from './config'
import {
  buildVideoDocument,
  sanitizeSanityId,
  validateVideoDocument,
} from './document'
import { parseVideoReference } from './providers'

type Status = 'dry-run' | 'written' | 'skipped' | 'failed'

type IngestOptions = {
  write: boolean
  limit: number | null
  videoUrl: string | null
  lang: string
  concurrency: number
}

export type IngestResult = {
  url: string
  videoId: string
  provider: string
  status: Status
  reason?: string
  warning?: string
  chapterSource?: ChapterSource
  segmentCount?: number
  chunkCount?: number
  chapterCount?: number
  documentId?: string
}

function positiveInteger(value: string, name: string, max?: number): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`)
  }

  const parsed = Number(value)

  if (parsed < 1 || (max !== undefined && parsed > max)) {
    throw new Error(
      max === undefined
        ? `${name} must be a positive integer`
        : `${name} must be between 1 and ${max}`,
    )
  }

  return parsed
}

export function parseArgs(argv: string[]): IngestOptions {
  const options: IngestOptions = {
    write: false,
    limit: null,
    videoUrl: null,
    lang: DEFAULT_LANG,
    concurrency: DEFAULT_CONCURRENCY,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--write') {
      options.write = true
      continue
    }

    if (!['--limit', '--video-url', '--lang', '--concurrency'].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`)
    }

    const value = argv[index + 1]

    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${argument} requires a value`)
    }

    if (argument === '--limit') {
      options.limit = positiveInteger(value, '--limit')
    } else if (argument === '--concurrency') {
      options.concurrency = positiveInteger(
        value,
        '--concurrency',
        MAX_CONCURRENCY,
      )
    } else if (argument === '--lang') {
      if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value)) {
        throw new Error('--lang must be a BCP 47 language code')
      }

      options.lang = value
    } else {
      options.videoUrl = value
    }

    index += 1
  }

  return options
}

function shortReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/\s+/g, ' ').trim().slice(0, 300)
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(items.length, 1)) },
      async () => {
        while (next < items.length) {
          const index = next
          next += 1
          results[index] = await worker(items[index])
        }
      },
    ),
  )

  return results
}

async function processUrl(
  url: string,
  options: IngestOptions,
): Promise<IngestResult> {
  const reference = parseVideoReference(url)

  if (!reference) {
    return {
      url,
      videoId: '',
      provider: 'unsupported',
      status: 'failed',
      reason: 'invalid or unsupported video URL',
    }
  }

  if (reference.provider !== 'youtube') {
    return {
      url,
      videoId: reference.videoId,
      provider: reference.provider,
      status: 'skipped',
      reason: `unsupported provider: ${reference.provider}`,
    }
  }

  try {
    const result = await fetchTranscript(reference.videoId, {
      lang: options.lang,
      retries: 2,
      videoDetails: true,
    })
    const segments = result.segments ?? []
    const description = result.videoDetails?.description ?? ''
    const rawSnapshot = {
      videoId: reference.videoId,
      url,
      lang: options.lang,
      segments,
      videoDetails: {
        title: result.videoDetails?.title ?? null,
        description,
        lengthSeconds: result.videoDetails?.lengthSeconds ?? null,
      },
    }

    await writeFile(
      join(rawDir, `${sanitizeSanityId(reference.videoId, url)}.json`),
      `${JSON.stringify(rawSnapshot, null, 2)}\n`,
    )

    const chapterResolution = await resolveChapters({
      videoId: reference.videoId,
      description,
      manifestPath: chapterManifestPath,
    })
    const chunks = segmentsToChunks(segments)
    const document = buildVideoDocument({
      provider: reference.provider,
      videoId: reference.videoId,
      url,
      chapters: chapterResolution.chapters,
      chunks,
    })
    const validationErrors = validateVideoDocument(document)

    if (validationErrors.length > 0) {
      return {
        url,
        videoId: reference.videoId,
        provider: reference.provider,
        status: 'failed',
        reason: validationErrors.join('; '),
      }
    }

    if (options.write) {
      await upsertVideo(document)
    }

    return {
      url,
      videoId: reference.videoId,
      provider: reference.provider,
      status: options.write ? 'written' : 'dry-run',
      warning: chapterResolution.warning,
      chapterSource: chapterResolution.source,
      segmentCount: segments.length,
      chunkCount: document.chunks.length,
      chapterCount: document.chapters.length,
      documentId: document._id,
    }
  } catch (error) {
    return {
      url,
      videoId: reference.videoId,
      provider: reference.provider,
      status: 'failed',
      reason: shortReason(error),
    }
  }
}

function printSummary(
  allUrls: number,
  results: IngestResult[],
  options: IngestOptions,
  verifiedCount: number | null,
): void {
  const counts = {
    'dry-run': 0,
    written: 0,
    skipped: 0,
    failed: 0,
  }

  for (const result of results) {
    counts[result.status] += 1
    console.log(
      `- ${result.status.toUpperCase()} ${result.videoId || result.url}` +
        ` chunks=${result.chunkCount ?? '-'}` +
        ` chapters=${result.chapterCount ?? '-'}` +
        ` source=${result.chapterSource ?? '-'}` +
        (result.reason ? ` reason=${result.reason}` : ''),
    )
  }

  console.log(`Published lesson video URLs: ${allUrls}`)
  console.log(
    options.write
      ? `WRITE MODE - upserted ${counts.written} video documents`
      : 'DRY RUN - no documents written',
  )
  console.log(
    `Counts: dry-run=${counts['dry-run']} written=${counts.written}` +
      ` skipped=${counts.skipped} failed=${counts.failed}`,
  )

  if (verifiedCount !== null) {
    console.log(`Verified written documents in Sanity: ${verifiedCount}`)
  }

  console.log(`Report: ${reportPath}`)
}

export async function run(argv: string[]): Promise<void> {
  const options = parseArgs(argv)
  const allUrls = await getLessonVideoUrls()

  if (options.videoUrl && !allUrls.includes(options.videoUrl)) {
    throw new Error('--video-url was not found in published lessons')
  }

  const targets = options.videoUrl ? [options.videoUrl] : allUrls
  const selected = options.limit ? targets.slice(0, options.limit) : targets

  await mkdir(rawDir, { recursive: true })

  const results = await mapWithConcurrency(selected, options.concurrency, (url) =>
    processUrl(url, options),
  )
  const writtenIds = results
    .filter((result) => result.status === 'written' && result.documentId)
    .map((result) => result.documentId as string)
  const verifiedCount =
    options.write && writtenIds.length > 0
      ? await countVideoDocuments(writtenIds)
      : null

  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: options.write ? 'write' : 'dry-run',
        lang: options.lang,
        publishedLessonUrls: allUrls.length,
        selected: selected.length,
        verifiedCount,
        results,
      },
      null,
      2,
    )}\n`,
  )

  printSummary(allUrls.length, results, options, verifiedCount)

  const failed = results.filter((result) => result.status === 'failed').length

  if (failed > 0) {
    process.exitCode = 1
  }

  if (verifiedCount !== null && verifiedCount !== writtenIds.length) {
    console.error('Sanity verification count does not match written documents')
    process.exitCode = 1
  }
}
