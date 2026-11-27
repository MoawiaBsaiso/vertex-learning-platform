# Implementation Prompt: Grounded Video Keyword Fallback

## 1. Goal

Make the deterministic keyword fallback search both lessons and ingested video lookup documents, so search still returns grounded video moments when Gemini skips Context MCP tool calls or returns lesson-only selectors. Keep Gemini/Context MCP as the primary path and preserve the existing server-side grounding, ranking, and on-site `/lessons/{slug}?start={seconds}` contract.

Do not edit `lib/search/prompt.ts` for this task.

## 2. Skills And Current Documentation Read

- `AGENTS.md`: prompt-first workflow, private-token rule, chapter-first timestamp behavior, grounded results only, bounded transcript reads, required checks, and Next.js feedback pass.
- `sanity-best-practices` skill and current Sanity MCP rules for `groq`, `nextjs`, and `typegen`: parameterized GROQ, published perspective, TypeGen-safe `defineQuery`, and server-only data access.
- `create-agent-with-sanity-context` skill: Context MCP remains the primary tool-using path; the fallback must not pretend to be MCP output.
- AI SDK v7 type inspection: `generateText` exposes `result.toolCalls`, `result.staticToolCalls`, and `result.steps`, so skipped MCP tool use can be detected without reading or logging tool payloads.

## 3. Code And Live State Inspected

- `lib/search/search.ts`:
  - `getKeywordFallbackSelectors()` currently calls `getKeywordSearchSelectors()` and emits only `kind: "lesson"` selectors.
  - `groundSearchPlan()` already validates course/module/lesson relationships, exact video URL joins, exact chapter/chunk start evidence, chapter-first suppression, dedupe, ranking, counts, and verified hrefs.
  - `videoCandidate()` builds `/lessons/{slug}?start={selector.startSeconds}` only from verified stored timestamps.
  - `searchVertex()` only runs fallback when Gemini throws or grounds to zero results; a lesson-only primary result prevents fallback from running.
- `sanity/lib/search.ts`:
  - `SEARCH_KEYWORD_SELECTORS_QUERY` only searches `lesson.title`, `pt::text(notes)`, and `keyPoints[]`.
  - `SEARCH_HYDRATION_QUERY` already fetches selected chapters, only matching transcript chunks via `chunks[startSeconds in $startSeconds]`, and all chunk start numbers for clip length.
- `lib/search/schema.ts`:
  - `lessonSelectorSchema` and `videoSelectorSchema` are strict; video selectors require `videoId`, integer `startSeconds`, and `matchSource: "chapter" | "transcript"`.
  - `normalizeSearchSelectors()` already converts untrusted model matches into safe selectors.
- `lib/search/context.ts`: Context MCP is server-only, allows a small tool set, validates the endpoint URL, caches initial context, and closes the client.
- `sanity/lib/client.ts`: server-only, published-perspective client with a read token.
- `app/api/search/route.ts`: validates `{query}` and streams safe NDJSON `status`, `results`, and `error` events.
- Live data in `x33ap7fq/production`:
  - `video-youtube-GErEgIOMy_4` is joined to lesson `building-ai-apps-with-llms-agent-loops` and has chapter starts including `160`.
  - `video-youtube-H-hagjt65cE` has a `DictReader` chapter at `213`.
  - A live `agent loop` search returned lesson results only: `videoResultCount=0`.
- Verified read-only GROQ probe with `$terms = ["agent*", "loop*"]` returned both lesson matches and video matches with `chapterStarts` and `chunkStarts`; the same query with `["dictreader*"]` returned the `DictReader` chapter at `213`.

## 4. Decisions And Assumptions

1. Extend `SEARCH_KEYWORD_SELECTORS_QUERY` into a union query over published lessons and published video documents. Use explicit `!(_id in path("drafts.**"))` filters in addition to the published client perspective.
2. Match lesson topic fields exactly as today: `title`, `pt::text(notes)`, and `keyPoints[]`.
3. Match video evidence with `chapters[].label` first and `chunks[].text` as the fallback. Keep them as separate start arrays so existing chapter-first suppression remains intact.
4. Join video matches to lessons by exact `video.url == lesson.videoUrl`, then find the course/module placement that contains that lesson reference. Never return a standalone video result.
5. Convert every valid GROQ placement into the existing strict selector shapes. Emit one selector per exact stored `startSeconds`; do not invent or round timestamps.
6. In `searchVertex()`, compute fallback selectors once and merge them into the primary selectors when Gemini made no MCP tool calls or when the primary plan contains no video selectors. If Gemini used tools and produced video selectors, preserve the current primary-only behavior.
7. Keep the existing fallback-on-error and fallback-on-zero-results behavior.
8. Deduplicate merged selectors before grounding so the same lesson/video moment is not hydrated twice.
9. Keep `lib/search/prompt.ts`, UI, route, schema, environment, analytics, and ingestion code unchanged.
10. No TypeGen is required because the Sanity schema is unchanged. Type checking infers the updated query result shape.

## 5. Files Expected To Touch

- `sanity/lib/search.ts`: replace the lesson-only keyword query with the verified lesson/video union query; keep the existing hydration query and helpers.
- `lib/search/search.ts`: convert all fallback match kinds into selectors, detect skipped MCP tool calls / absent video selectors, merge and dedupe selectors before grounding.
- `prompts/search-video-keyword-fallback.md`: this approved contract.

## 6. Requirements

### 6.1 GROQ query

Use the verified shape below, with `$terms` passed as GROQ parameters only:

```groq
*[
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
}
```

### 6.2 Selector conversion

- Preserve current lesson selector conversion.
- For each video match, require `videoId`, `lessonId`, `courseId`, and a module key whose `lessonIds` contains that lesson.
- Emit `kind: "video"`, `matchSource: "chapter"` for each `chapterStarts` value and `matchSource: "transcript"` for each `chunkStarts` value.
- Ignore malformed or partial matches; `groundSearchPlan()` must remain the final verifier.
- Deduplicate selectors by their validated distinguishing fields.

### 6.3 Triggering fallback

- `result.toolCalls.length === 0 && result.staticToolCalls.length === 0` means Gemini skipped MCP tools: merge fallback selectors.
- Primary plan with no `kind: "video"` selector: merge fallback selectors to recover grounded video moments.
- Primary plan with at least one video selector and MCP tool calls: keep primary selectors only.
- Gemini error or zero grounded results: keep the existing fallback-only path.
- Do not log tool names, payloads, queries, transcript text, or model output when detecting tool use.

## 7. Security Considerations

- User input is still validated to 2-200 characters server-side before tokenization.
- Terms are generated server-side and passed only as GROQ parameters; never interpolate query text.
- The Sanity read token stays server-only; the browser still only calls `/api/search`.
- Published filters are explicit; drafts and stale documents cannot be returned as fallback selectors.
- The request path still fetches only selected transcript chunks, never whole `chunks` arrays or whole transcripts.
- Every fallback selector still passes through `groundSearchPlan()`; no result, description, count, or timestamp is trusted directly from GROQ or the model.
- Chapter-first suppression and dedupe in `groundSearchPlan()` remain authoritative.

## 8. Acceptance Criteria

- `POST /api/search` with `{"query":"agent loop"}` returns a `results` event with `videoResultCount > 0` and at least one grounded video result whose `href` is `/lessons/building-ai-apps-with-llms-agent-loops?start=<exactStoredSecond>`.
- `POST /api/search` with `{"query":"DictReader"}` returns a grounded video result at the stored chapter start `213` when that document is present.
- Video results remain tied to published lessons by exact `video.url == lesson.videoUrl`; no standalone video document appears.
- Transcript selectors are suppressed for a video whenever a verified chapter selector exists for that video.
- Nonsense queries still return zero results and the existing empty state.
- Gemini paths that use MCP tools and return video selectors keep their existing behavior.
- No draft documents, invented timestamps, full transcripts, secrets, or raw model/MCP payloads appear in API responses or logs.
- `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` pass.

## 9. Checks To Run

1. `npm run typecheck`.
2. `npm run lint`.
3. `npm run build` because server modules changed.
4. `git diff --check`.
5. Start `npm run dev` and `POST /api/search` with `{"query":"agent loop"}`. Parse NDJSON and report exact `total`, `videoResultCount`, `lessonResultCount`, and one video result `id`, `startSeconds`, and `href`.
6. Repeat with `{"query":"DictReader"}` and report the exact chapter-based video result.
7. Repeat with a nonsense query such as `{"query":"zzzqqqxyz"}` and confirm zero results.
8. Confirm no server secret, MCP payload, or transcript array appears in the response body.

## 10. Exact Manual Test Steps

1. Start the app with `npm run dev`.
2. Send `POST http://localhost:3000/api/search` with `Content-Type: application/json` and body `{"query":"agent loop"}`.
3. Confirm the final NDJSON event type is `results` and `data.videoResultCount` is greater than zero.
4. Open one returned video `href`; confirm it targets the lesson page with the exact stored `?start=` second and plays there.
5. Send `{"query":"DictReader"}`; confirm the `VIDEO` card points to the CSV lesson at start `213` and no lesson-only card replaces it.
6. Send `{"query":"zzzqqqxyz"}`; confirm the empty state, not invented matches.
7. Inspect browser/devtools network: only `/api/search` is called; no token, endpoint URL, Sanity request, or transcript array is exposed.
