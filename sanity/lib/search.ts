import 'server-only'

import { defineQuery } from 'next-sanity'

import { client } from './client'

export const SEARCH_HYDRATION_QUERY = defineQuery(`{
  "courses": *[
    _type == "course" &&
    !(_id in path("drafts.**")) &&
    _id in $courseIds
  ] {
    _id,
    title,
    "slug": slug.current,
    summary,
    icon,
    modules[]{
      _key,
      title,
      summary,
      "lessonIds": lessons[]._ref
    }
  },
  "lessons": *[
    _type == "lesson" &&
    !(_id in path("drafts.**")) &&
    _id in $lessonIds
  ] {
    _id,
    title,
    "slug": slug.current,
    videoUrl,
    thumbnail,
    duration,
    keyPoints,
    "notesText": pt::text(notes)
  },
  "videos": *[
    _type == "video" &&
    !(_id in path("drafts.**")) &&
    _id in $videoIds
  ] {
    _id,
    id,
    url,
    chapters[]{
      _key,
      startSeconds,
      label
    },
    "matchingChunks": chunks[startSeconds in $startSeconds]{
      _key,
      startSeconds,
      text
    },
    "chunkStarts": chunks[].startSeconds
  }
}`)

export const SEARCH_KEYWORD_SELECTORS_QUERY = defineQuery(`*[
  _type == "lesson" &&
  !(_id in path("drafts.**")) &&
  count($terms[
    ^.title match @ ||
    pt::text(^.notes) match @ ||
    ^.keyPoints[] match @
  ]) > 0
] {
  "kind": "lesson",
  "lessonId": _id,
  "placements": *[
    _type == "course" &&
    references(^._id)
  ] {
    "courseId": _id,
    modules[]{
      _key,
      "lessonIds": lessons[]._ref
    }
  }
} + *[
  _type == "video" &&
  !(_id in path("drafts.**")) &&
  (
    count($terms[^.chapters[].label match @]) > 0 ||
    count($terms[^.chunks[].text match @]) > 0
  )
] {
  "kind": "video",
  "videoId": _id,
  "chapterStarts": chapters[count($terms[^.label match @]) > 0][].startSeconds,
  "chunkStarts": chunks[count($terms[^.text match @]) > 0][].startSeconds,
  "placements": *[
    _type == "lesson" &&
    !(_id in path("drafts.**")) &&
    videoUrl == ^.url
  ] {
    "lessonId": _id,
    "placements": *[
      _type == "course" &&
      references(^._id)
    ] {
      "courseId": _id,
      modules[]{
        _key,
        "lessonIds": lessons[]._ref
      }
    }
  }
}`)

export type SearchHydrationParams = {
  courseIds: string[]
  lessonIds: string[]
  videoIds: string[]
  startSeconds: number[]
}

export function getSearchHydration(params: SearchHydrationParams) {
  return client.fetch(SEARCH_HYDRATION_QUERY, params)
}

export function getKeywordSearchSelectors(terms: string[]) {
  return client.fetch(SEARCH_KEYWORD_SELECTORS_QUERY, { terms })
}

export type SearchHydration = Awaited<ReturnType<typeof getSearchHydration>>
export type KeywordSearchSelectors = Awaited<
  ReturnType<typeof getKeywordSearchSelectors>
>
