import { createClient } from '@sanity/client'

import {
  readTokenValue,
  requireWriteToken,
  sanityConfig,
} from './config'
import { videoDocumentId, type VideoDocument } from './document'

const clientOptions = {
  ...sanityConfig,
  useCdn: false,
}

export const readClient = createClient({
  ...clientOptions,
  token: readTokenValue,
  perspective: 'published',
})

let cachedWriteClient: ReturnType<typeof createClient> | null = null

function getWriteClient() {
  if (!cachedWriteClient) {
    cachedWriteClient = createClient({
      ...clientOptions,
      token: requireWriteToken(),
    })
  }

  return cachedWriteClient
}

export const LESSON_URLS_QUERY = `*[
  _type == "lesson" &&
  defined(videoUrl) &&
  !(_id in path("drafts.**"))
]{
  videoUrl
}`

export const VIDEO_COUNT_QUERY = `count(*[
  _type == "video" &&
  _id in $ids
])`

export async function getLessonVideoUrls(): Promise<string[]> {
  const rows = await readClient.fetch<Array<{ videoUrl?: string }>>(
    LESSON_URLS_QUERY,
  )

  const urls = rows
    .map((row) => row.videoUrl?.trim())
    .filter((url): url is string => Boolean(url))

  return Array.from(new Set(urls)).sort()
}

export async function upsertVideo(document: VideoDocument): Promise<void> {
  await getWriteClient().createOrReplace(document)
}

export async function countVideoDocuments(ids: string[]): Promise<number> {
  if (ids.length === 0) {
    return 0
  }

  return readClient.fetch<number>(VIDEO_COUNT_QUERY, { ids })
}

export { videoDocumentId }
