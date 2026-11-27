# Implementation Prompt: Vertex Offline Video Ingestion Pipeline

## 1. Goal

Build the offline, rerunnable ingestion tooling that creates Sanity `video` lookup documents from real provider captions and chapter markers:

1. Read published lesson `videoUrl` values from the existing private Sanity dataset.
2. For each supported unique video, fetch the source transcript and source chapter markers.
3. Transform the transcript into many short `{startSeconds, text}` chunks and chapters into `{startSeconds, label}` entries.
4. Upsert one `video` document per unique video URL with a deterministic, sanitized `_id`.
5. Keep the whole transcript out of Sanity and out of every request path.

This task does not change the web app, search route, lesson player, or content schemas. Search already expects these documents. Ingestion never runs during a learner request.

## 2. Skills And Current Documentation Read

- `AGENTS.md`: two-workspace layout, internal-only video lookup, chapter-first then transcript fallback, provider/playback rule, private-token rule, write-through-server-route rule for app state, prompt-then-approval workflow, and required checks.
- `sanity-best-practices` skill and MCP rules for `schema`, `groq`, `project-structure`, `migration`, and `typegen`:
  - deterministic, repeatable offline scripts;
  - project fields for source identity, explicit projections in GROQ, dated API version, low-concurrency writes;
  - validate transformed documents before import because Studio validation does not run on client writes;
  - snapshot raw extractions before transformation;
  - standalone Studio stays separate from the Next.js app.
- `sanity-migration` skill and `references/general.md`: inventory, map, extract, transform, load, validate, repeatable/idempotent scripts, per-record quality reporting.
- Sanity MCP live schema read: `video`, `videoChapter`, and `videoChunk` already exist and are deployed; no schema change is needed.
- Current package docs checked:
  - `youtube-transcript-plus@2.0.5` README: `fetchTranscript(..., {videoDetails: true, retries, lang})` returns `{segments: [{text, offset, duration, lang}], videoDetails: {title, description, lengthSeconds, ...}}`; `listLanguages` and typed errors are available. Node >= 20 requirement; local Node is v26.13.0.
  - The package was probe-run in a temporary directory against a live lesson video (`GErEgIOMy_4`): 425 segments returned, and `videoDetails.description` contained `00:00`, `00:22`, ... chapter lines. Two other live samples returned transcripts but no description timestamp lines. This proves both the transcript path and the need for an empty-chapter/manifest fallback.
- Next.js docs were not needed: no route, page, component, or server module changes are planned.

## 3. Code And Live State Inspected

- `studio/schemaTypes/documents/video.ts`:
  - `id` string required, max 240.
  - `url` url required; description says it must exactly match the lesson URL.
  - `chapters` array of `videoChapter`, optional, ordered/unique `startSeconds`.
  - `chunks` array of `videoChunk`, required min 1, ordered/unique `startSeconds`.
- `studio/schemaTypes/objects/video-chapter.ts`: `{startSeconds: integer >= 0, label: string <= 160}`.
- `studio/schemaTypes/objects/video-chunk.ts`: `{startSeconds: integer >= 0, text: text <= 1200}`.
- `studio/structure.ts`: already lists `video` as “Videos (internal)”.
- `components/lesson/videoEmbed.ts`: YouTube `?start=`, Vimeo `?t=`, Bunny passthrough only. Bunny does not inject a start parameter, so Bunny seek is not implemented.
- `components/lesson/LessonVideo.tsx`: reads `?start=<integerSeconds>` and passes it to `buildVideoEmbed`.
- `sanity/lib/search.ts`: joins on exact `video.url === lesson.videoUrl`, fetches `chapters[]` and only matching `chunks[startSeconds in $startSeconds]`; never fetch full transcripts here.
- `lib/search/prompt.ts`: chapter labels first, transcript chunks only as fallback, never return a whole transcript.
- `studio/scripts/extract-schema.ts`: established offline script convention — TypeScript in `studio/scripts`, run with `tsx --env-file=.env.local`, `console.log` summary, exit code on failure.
- `studio/package.json`: has `tsx` and `typescript`; no `@sanity/client` and no transcript library yet.
- Root `package.json`: has `@sanity/client@^7.28.0`, but the Studio is a separate workspace and should declare its own CLI dependencies.
- `studio/.env.local`: currently only `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_STUDIO_API_VERSION`. Root `.env.local` has read/write Sanity tokens.
- `.env.example`: canonical env list already includes `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN`; needs a note that the CLI reads them from `studio/.env.local`.
- `.gitignore`: ignores env files broadly; needs an explicit ignore for generated ingestion artifacts.
- Live `x33ap7fq/production`:
  - 121 total lessons, 120 published, 120 distinct published `videoUrl` values, 0 `video` documents.
  - All 121 lesson URLs are `https://www.youtube.com/watch?v=...`; there are zero Vimeo and zero B URLs in content.
  - Live lesson `duration` values are plausible seconds (for example 950 for `GErEgIOMy_4`).
- Git worktree is clean before this task.

## 4. Decisions And Assumptions

1. **Implement YouTube ingestion now.** It is the only provider present in live lessons, and YouTube playback with `?start=` already exists. Vimeo has seek playback but no captions/chapters source configured here; Bunny has no start injection. The CLI will detect and report Vimeo/Bunny/unknown URLs as `unsupported` and skip them. Do not claim those providers are supported and do not change playback code in this task.
2. **Keep the pipeline in the Studio workspace** under `studio/scripts/video-ingestion/`. It is offline content-authoring tooling, not web/server code. It uses `tsx --env-file=.env.local` like `extract-schema.ts`.
3. **No schema or TypeGen change.** The deployed schema already matches the required document shape. Do not edit `studio/schemaTypes/**` or `sanity.types.ts`.
4. **Source of truth is published lessons only.** Query `_type == "lesson" && !(_id in path("drafts.**"))`, project only `videoUrl`, deduplicate exact strings in code, and sort for deterministic runs. Do not ingest drafts or URLs not attached to a published lesson.
5. **One document per exact lesson URL.** This preserves the exact-equality join used by search. If two URLs ever point to the same provider ID, they get separate documents; report that as a note rather than guessing which URL to canonicalize.
6. **Deterministic document `_id`.** Build `video-<provider>-<providerVideoId>`, then sanitize to Sanity-allowed characters `[A-Za-z0-9_.-]`. Replace other characters with `-`, collapse repeats, trim leading/trailing separators, cap at 128 characters, and append an 8-character SHA-1 of the original URL if sanitization changes the value. This is required by the product spec for keyed video lookup documents.
7. **`id` field is the raw provider video ID** (YouTube 11-character ID), never a URL. `url` field is the exact published lesson URL.
8. **Dry-run is the default.** Writes happen only with `--write`. No production write is part of this approved task; a separate confirmation is required before running `--write`.
9. **Transcript source:** `youtube-transcript-plus` with `videoDetails: true`, `lang` from `--lang` (default `en`), and retries default 2. Use returned `segments`; never invent or translate text.
10. **Chapter source, in order:** (a) timestamp lines in `videoDetails.description`, parsed to `{startSeconds, label}` when there are at least two; (b) if fewer than two description timestamp lines, fetch the YouTube watch page HTML and extract chapter markers from `ytInitialData` (`chapterRenderer` and `macroMarkersListItemRenderer` entries using `timeRangeStartMillis` plus their title text), deduplicated by `startSeconds`; (c) optional authored overrides in committed `studio/scripts/video-ingestion/chapters.json`, keyed by provider video ID; (d) `[]`. Never derive chapter labels from transcript text. Require at least two parsed timestamp lines before accepting description chapters, so a stray timestamp in prose is not treated as a table of contents. The watch-page fallback is best-effort: network/parse failures are recorded and then the manifest/`[]` fallback applies.
11. **Chunking:** sort segments by `offset`; group into ~30 second windows, also flushing when the group would exceed 1000 characters. `startSeconds = Math.floor(firstSegment.offset)`; merge/advance by one second if a start would duplicate the previous chunk. Trim and collapse whitespace. Drop empty chunks. Keep every chunk <= 1200 characters to satisfy the schema. At least one non-empty chunk is required or the video is skipped as `failed`.
12. **Raw snapshots and report:** write raw provider responses to `studio/.video-ingestion/raw/<sanitized-id>.json` and a small summary to `studio/.video-ingestion/report.json`; both are gitignored. Raw snapshots are local/offline only. No full transcript is ever written to Sanity.
13. **Failure isolation:** one video failing must not stop the batch. Record reason and continue. Exit code 1 if any video failed, with a final summary.
14. **Validation before write:** verify exact URL, non-empty provider ID, strictly increasing non-negative integer start times, non-empty labels, non-empty chunk text, chunk text <= 1200, and chapter label <= 160. Use `client.createOrReplace` so reruns converge. Only the `video` document type is written.

## 5. Files Expected To Touch

- `prompts/vertex-video-ingestion.md`: this approved contract.
- `studio/package.json` / `studio/package-lock.json`: add scripts and dependencies:
  - `ingest:videos`: `tsx --env-file=.env.local scripts/ingest-videos.ts`
  - `test:video-ingestion`: `tsx --test scripts/video-ingestion/*.test.ts`
  - devDependencies: `youtube-transcript-plus@^2.0.5`, `@sanity/client@^7.28.0`
- `studio/env` handling for the CLI (new file in `studio/scripts/video-ingestion/`): assert project id, dataset, dated API version, read token, and write token from `studio/.env.local`. Never print token values.
- `studio/scripts/video-ingestion/providers.ts`: URL parsing, provider detection, YouTube ID extraction, unsupported-provider result type.
- `studio/scripts/video-ingestion/chapters.ts`: description timestamp parsing, best-effort YouTube watch-page `ytInitialData` chapter extraction, and optional authored manifest loading.
- `studio/scripts/video-ingestion/chunks.ts`: segment-to-chunk transform and validation.
- `studio/scripts/video-ingestion/document.ts`: Sanity document builder, sanitized `_id`, pre-write validation, stable array `_key` values.
- `studio/scripts/video-ingestion/client.ts`: GROQ lesson-URL query, Sanity clients, `createOrReplace` write, post-write verification query.
- `studio/scripts/video-ingestion/ingest.ts`: CLI flags, orchestration, concurrency, raw snapshots, report, summary logging.
- `studio/scripts/video-ingestion/chapters.json`: committed `{}` manifest with no fabricated chapters.
- `studio/scripts/video-ingestion/*.test.ts`: focused tests for timestamp parsing, chunk ordering/uniqueness/length, ID sanitization, provider detection, and document validation.
- `studio/scripts/ingest-videos.ts`: thin CLI entry point matching the `extract-schema.ts` convention.
- `.env.example`: document that the CLI reads `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN` from `studio/.env.local` too.
- `.gitignore`: ignore `studio/.video-ingestion/`.
- `README.md`: short “Video ingestion” runbook with dry-run/write commands and the provider limitation.
- Do not touch: `app/**`, `components/**`, `lib/**`, `sanity/**`, `studio/schemaTypes/**`, `sanity.types.ts`, `prompts/**` other than this file.

## 6. Requirements

### CLI

- Usage examples:
  - `npm --prefix studio run ingest:videos -- --limit 2`
  - `npm --prefix studio run ingest:videos -- --video-url "https://www.youtube.com/watch?v=GErEgIOMy_4"`
  - `npm --prefix studio run ingest:videos -- --video-url "..." --write`
- Flags: `--write`, `--limit <n>`, `--video-url <exactUrl>`, `--lang <bcp47>`, `--concurrency <n>`.
- `--limit` and `--concurrency` must be positive integers; reject invalid values with a clear error.
- `--video-url` must match a distinct URL from the published lesson query; otherwise fail fast with “not found in published lessons”.
- Default output must state `DRY RUN - no documents written` and never call a write mutation.
- With `--write`, log created `_id`s and a final count; do not log tokens, full descriptions, or full transcripts.

### Provider adapters

- `detectProvider(url)` returns `youtube`, `vimeo`, `bunny`, or `unsupported` based on host/path rules consistent with `studio/schemaTypes/documents/lesson.ts` and `components/lesson/videoEmbed.ts`.
- YouTube accepts `watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, and `/v/` forms, but the stored `url` remains the exact lesson string.
- Vimeo/Bunny/unknown: return `skipped` with reason `unsupported provider: <provider>`; do not throw and do not write.

### Transform

- Description chapter regex must support `0:00`, `00:00`, and `1:02:03` followed by whitespace and a label; trim label, strip leading bullet/dash characters, cap at 160 characters, drop empty labels, sort by seconds, keep unique starts.
- Watch-page fallback: when description parsing yields fewer than two chapters, fetch `https://www.youtube.com/watch?v=<id>` with a normal browser user agent, locate the `ytInitialData` JSON assignment, recursively walk objects for `chapterRenderer` and `macroMarkersListItemRenderer`, read `timeRangeStartMillis` and title text (`title.simpleText` or `runs[].text`), convert milliseconds to integer seconds, and deduplicate by `startSeconds`. Never execute page scripts; parse JSON only. Treat failures as `chapters: []` plus a recorded warning.
- Chunks must be strictly ordered with unique integer `startSeconds >= 0`; merge or advance duplicate starts.
- Use `_key` values like `h0`, `c0` for stable reruns; never rely on array index alone.
- If a fetched segment has no text after cleaning, drop it. If all segments are empty, fail that video.

### Writes

- Sanity client uses `apiVersion` from `SANITY_STUDIO_API_VERSION` (dated default `2026-11-16`), `projectId`/`dataset` from Studio env, `useCdn: false`, and `perspective: 'published'` for reads.
- Write client uses `SANITY_API_WRITE_TOKEN` from `studio/.env.local`; it is server/CLI only.
- `createOrReplace` payload contains only `_id`, `_type: 'video'`, `id`, `url`, `chapters`, `chunks`.
- After `--write`, re-query counts for the written IDs to confirm each document exists and report the count.

## 7. Security Considerations

- No token, token prefix, or secret is logged, written to the report, or written to a document.
- The CLI is offline-only and is never imported by Next.js code; no browser bundle can reach it.
- Environment values come from `studio/.env.local`, which is gitignored. `.env.example` lists names only.
- Do not fetch arbitrary learner-supplied URLs: the URL list comes only from published Sanity lessons, and `--video-url` is checked against that list.
- Do not widen dataset visibility. Do not use a public dataset.
- Raw transcript snapshots stay in gitignored local files; only short chunks go to Sanity.
- No provider API keys are introduced; YouTube captions are fetched from public caption tracks through the library. If YouTube blocks/rate-limits, report the failure honestly rather than retrying indefinitely.

## 8. Acceptance Criteria

- `npm --prefix studio run test:video-ingestion` passes.
- `npm run typecheck:studio` and `npm run lint` pass; `npm run typecheck` and `npm run build` also pass.
- `npm --prefix studio run ingest:videos -- --limit 2` runs against live `x33ap7fq/production`, reports `DRY RUN`, creates raw snapshots and a report, and writes zero documents.
- The dry-run summary shows segment counts, chunk counts, and chapter counts for processed videos, and explains skipped unsupported providers.
- A targeted dry-run for `https://www.youtube.com/watch?v=GErEgIOMy_4` produces chapters from its description timestamps and many short transcript chunks, not one big transcript field.
- A video with fewer than two description timestamps uses the watch-page `ytInitialData` fallback when markers exist; otherwise it produces `chapters: []` (or manifest chapters if explicitly authored) and still produces valid chunks.
- With `--write`, rerunning for the same URL replaces the same deterministic `_id` and does not create duplicate video documents; the live `video` count increases only for newly processed URLs.
- A later `/search?q=agent+loop` can use the ingested chapter to return a video moment linking to `/lessons/<slug>?start=<seconds>`; the existing embed starts at that second. This search verification may be deferred until a user authorizes the production write.

## 9. Checks To Run

From the repo root:

```bash
npm --prefix studio install
npm --prefix studio run test:video-ingestion
npm run typecheck:studio
npm run typecheck
npm run lint
npm run build
```

Live dry run after copying read/write token names into `studio/.env.local`:

```bash
npm --prefix studio run ingest:videos -- --limit 2
npm --prefix studio run ingest:videos -- --video-url "https://www.youtube.com/watch?v=GErEgIOMy_4"
```

Report the real command output. Do not run `--write` in this task.

## 10. Exact Manual Test Steps

1. Copy `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN` from the root `.env.local` into `studio/.env.local` (names only in docs; never commit values).
2. Run `npm --prefix studio install`.
3. Run `npm --prefix studio run ingest:videos -- --limit 2`. Confirm the console says `DRY RUN - no documents written`, shows two processed YouTube videos, and writes `studio/.video-ingestion/raw/*.json` plus `studio/.video-ingestion/report.json`.
4. Inspect one raw snapshot: it must contain source segments and description text; it must not be written to Sanity.
5. Inspect the report: each processed row must show exact `url`, YouTube `id`, segment count, chunk count, chapter count, and status.
6. Run `npm --prefix studio run ingest:videos -- --video-url "https://www.youtube.com/watch?v=GErEgIOMy_4"`. Confirm chapter labels come from that video's description timestamps and that chunk texts are short and sorted.
7. Run `npm --prefix studio run ingest:videos -- --video-url "https://example.com/not-a-lesson"`. Confirm it fails fast because the URL is not in published lessons.
8. After separate user approval for production writes, run the same targeted command with `--write`, then query the live `video` document by its deterministic `_id` and confirm `chunks[]` and `chapters[]` are present.
9. In the running web app, search for a topic covered by an ingested chapter and confirm the result card links to `/lessons/<slug>?start=<seconds>` and the provider embed seeks there.

## 11. Out Of Scope

- No Vimeo or Bunny caption ingestion.
- No Bunny seek implementation in the lesson player.
- No schema, TypeGen, search prompt, search route, search UI, or lesson page changes.
- No production write execution without explicit user approval after this implementation.
- No inferred, translated, summarized, or fabricated transcript/chapter content.
