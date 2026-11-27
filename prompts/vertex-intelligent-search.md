# Implementation Prompt: Vertex Intelligent Search

## 1. Goal

Implement Vertex's public intelligent search end to end:

1. Configure a Sanity Context MCP endpoint over the published `course`, `lesson`, and internal `video` documents.
2. Add a server-only Next.js search API that connects to Context MCP, inlines its initial context, lets OpenAI query Sanity through MCP, validates structured output with Zod, and deterministically grounds every result against Content Lake.
3. Add `/search?q=...` as a full results page with ranked video-moment and lesson cards, a real result count, client-side sorting, loading/error/empty states, and links into the existing lesson page.
4. Add the `video` content model required for verified chapters and timestamped transcript chunks without building the separate ingestion pipeline in this task.
5. Deploy and verify the local Studio/schema and Context endpoint against the live project after local checks pass.

Search is a results experience, not a chatbox. It must never invent a course, lesson, result count, description, or timestamp.

## 2. Skills And Current Documentation Read

- `AGENTS.md`: product scope, server/client boundaries, private-token rule, video lookup model, chapter-first timestamp behavior, required result shapes, query rules, deployment requirements, and verification workflow.
- `create-agent-with-sanity-context` skill and `references/connecting-an-agent.md`:
  - Context endpoint and organization-token requirements.
  - HTTP MCP transport through `@ai-sdk/mcp`.
  - `/initial-context` fetch, five-minute warm-instance cache, and `initial_context` tool fallback.
  - Multi-step tool execution and MCP-client cleanup.
- `dial-your-context` skill: endpoint `groqFilter` and concise, dataset-specific instructions containing only non-obvious relationships and query rules.
- `shape-your-agent` skill: short behavioral system prompt, grounding boundaries, and honest empty-result behavior.
- `sanity-best-practices` skill plus current Sanity development rules for `schema`, `groq`, `typegen`, `nextjs`, and `project-structure`.
- Current Sanity Context docs:
  - `context/connect-vercel-ai-sdk`: AI SDK v7 / MCP v2 integration and organization Context Viewer token.
  - `context/mcp-reference`: endpoint URL, deployed-Studio requirement, endpoint filters, BM25 keyword behavior, and embeddings fallback.
  - `context/mcp-tools`: `initial_context`, `schema_explorer`, `groq_query`, and `array_field_reader` for dataset sources.
  - `context/best-practices`: server-only token, structured UI output, endpoint-owned configuration, and focused system prompt.
  - `context/inline-initial-context`: five-minute cache and retaining the fallback tool when the fetch fails.
  - September 2026 Context changelog: new setups use an MCP endpoint in the Dashboard/CLI; the old Studio Context plugin/document flow is deprecated.
- AI SDK v7 docs:
  - Structured outputs use `streamText`/`generateText` with `Output.object(...)` and a Zod schema.
  - MCP production transport is HTTP; close per-request clients and pass only the tools the agent needs.
  - OpenAI is connected through `@ai-sdk/openai`; strict structured schemas cannot rely on optional properties.
- Next.js 16.4.6 docs from `node_modules/next/dist/docs/`:
  - App Router Route Handlers use Web `Request`/`Response`; `POST` is uncached.
  - `searchParams` is a Promise and makes the page request-time rendered.
  - Runtime/uncached work belongs behind `Suspense` with Cache Components enabled.
  - Server-only environment values remain outside the browser bundle.

## 3. Code And Live State Inspected

- Root `package.json`: Next.js 16.4.6, React 19.3, TypeScript, Tailwind 4, Sanity, Clerk, and PostHog. No direct `ai`, `@ai-sdk/openai`, `@ai-sdk/mcp`, or `zod` dependency yet.
- `components/search/HomeSearchForm.tsx`: native `GET /search` form with query key `q`; `/search` currently does not exist.
- `components/ui/Input.tsx`, `components/ui/Badge.tsx`, `components/cards/Cards.tsx`, `components/navigation/SiteHeader.tsx`, and `components/icons/VertexIcons.tsx`: established controls, badges, visual language, and prototype result-card patterns.
- `app/globals.css`, `app/home.css`, and `app/course.css`: warm cream canvas, Playfair/Inter typography, orange accent, borders, radii, and responsive frame patterns to preserve.
- `app/lessons/[slug]/page.tsx` and `components/lesson/` are pending untracked work. Search must consume, not overwrite, their deep-link contract: `/lessons/{slug}?start={integerSeconds}`.
- `sanity/lib/client.ts`: existing server-only, token-authenticated, published-perspective client using `useCdn: false` and Next Cache Components.
- `sanity/lib/queries.ts` and `sanity/lib/data.ts`: existing course/lesson reads. Search-specific queries should go in a new file to minimize overlap with pending lesson-page edits.
- `studio/schemaTypes/`:
  - `course` owns ordered embedded modules.
  - each module owns an ordered array of lesson references.
  - `lesson` has no parent course reference and stores its provider `videoUrl`, thumbnail, duration, key points, and Portable Text notes.
  - no `video` schema exists.
- `studio/sanity.cli.ts`: TypeGen scans `app`, `components`, and `sanity` and writes root `sanity.types.ts`.
- Local environment targets Sanity project `x33ap7fq`, dataset `production`, organization `ocay3gkq4`.
- Live published content has 10 courses, 120 lessons, complete notes/key points/thumbnails, YouTube URLs, and zero `video` documents.
- Live dataset is currently public even though the application requires a private dataset.
- No Studio application and no schema are deployed. Context MCP refuses dataset endpoints until a Studio 5.1+ application is deployed.
- No embeddings index exists, so this implementation must use wildcarded keyword/BM25 matching and explicitly disable endpoint semantic search.
- The current Sanity Studio version is 5.31.2, sufficient for Context's deployed-Studio requirement.
- Current worktree already modifies `package.json`, `package-lock.json`, `.env.example`, `sanity.types.ts`, `sanity/lib/queries.ts`, and `sanity/lib/data.ts`; implementation must preserve those changes.

## 4. Decisions And Assumptions

1. **Use the project selected by local config.** All local and remote work targets `x33ap7fq/production`, not the separate empty project named `Vertex` (`pa9vwkzb`).
2. **Modern Context endpoint, no deprecated plugin.** Do not install `@sanity/context` or add a legacy agent-context schema. The MCP endpoint is the current Context configuration document and owns the filter and query instructions.
3. **Proposed immutable endpoint name:** `vertex-search`, title `Vertex Search`. Endpoint source is `x33ap7fq/production`, workspace `default`, perspective `published`, semantic search off.
4. **Endpoint filter:** `_type in ["course", "lesson", "video"]`. This is a static server-side boundary and is never constructed from learner input.
5. **Context instructions are data/query guidance.** They describe the reverse lesson-to-course relationship, ordered module numbering, chapter-first lookup, transcript fallback, token wildcarding, internal-only video documents, and ranking rules. Keep the same load-bearing query rules in the inline system prompt as required by the project.
6. **OpenAI model is configurable.** Add server-only `OPENAI_SEARCH_MODEL` with `gpt-5-mini` as the documented default. Keep `OPENAI_API_KEY`, `SANITY_CONTEXT_MCP_URL`, and `SANITY_ORGANIZATION_TOKEN` server-only.
7. **Two-stage grounding boundary.** The model returns only structured selectors and ordering evidence, never browser-ready cards. The server then fetches canonical Sanity documents, verifies relationships and exact timestamp evidence, derives every display field/href/count, drops invalid selectors, deduplicates, and ranks the survivors.
8. **No generated prose.** Result descriptions come from stored module summaries, lesson notes/key points, chapter labels, or matching transcript chunk text. `react-markdown` is not needed because this feature does not render an LLM-written reply.
9. **Structured selector contract.** Use a strict Zod discriminated union:
   - lesson selector: `kind`, `courseId`, `moduleKey`, `lessonId`.
   - video selector: the same relationship keys plus `videoId`, exact `startSeconds`, and `matchSource` (`chapter` or `transcript`).
   - no optional properties; the result object contains `matches: []` when nothing fits.
10. **All relevant results, no arbitrary global top-N.** Return at most one lesson card per lesson and all relevant chapter moments. Transcript fallback may return only a few filtered moments per video as required to protect context size; never return a whole chunks array to the model.
11. **Deterministic ranking.** Exact lesson-title concepts rank first, then matching chapters, then lesson title/key-point/notes topic matches, then transcript fallback. Model order is only a tiebreaker after the server verifies evidence.
12. **Chapter-first enforcement.** A transcript selector for a video is accepted only when the agent found no relevant chapter for that video. The prompt requires querying chapter labels before chunks; the server rejects duplicate transcript selectors when a verified chapter selector exists for the same video/query result set.
13. **Hydration stays bounded.** Fetch selected lessons/courses and only selected transcript chunks. It is acceptable to fetch chapter arrays and arrays of chunk start numbers to derive clip length; never fetch the full transcript text into the request path.
14. **Streaming protocol.** `/api/search` returns newline-delimited JSON (`application/x-ndjson`) with safe `status`, final `results`, and safe `error` events. MCP tool arguments/results and ungrounded model output are never streamed to the browser. The final event contains only verified card DTOs.
15. **Search page boundary.** `app/search/page.tsx` is a Server Component that awaits `searchParams` and renders a narrow client search experience under `Suspense`. The client aborts stale requests when `q` changes and incrementally reads NDJSON.
16. **Sort control.** Default `relevance`; offer deterministic client-side sorting by course and result type without re-querying or altering the canonical result count.
17. **Analytics.** Preserve the existing homepage `search_submitted` event. Capture one `search_performed` event after completion with counts, latency, and query length, not raw query text. Capture result kind/rank on click without sending lesson notes or transcript text.
18. **Public search remains public.** Do not gate `/search` with Clerk. Apply strict body/content-type/query limits, an agent-step limit, request abort handling, and safe errors. A deployment-level distributed rate limit remains an operational requirement; do not claim an in-memory serverless map is a complete rate limiter.
19. **Video data honesty.** Add the schema and full search/rendering path, but do not synthesize timestamps or transcript text. Because the live dataset has no video documents and ingestion is a separate feature, live searches will initially produce lesson cards only. Video cards appear automatically after verified `video` documents are ingested.
20. **Provider support.** Search deep links rely on the pending lesson player's existing YouTube/Vimeo start behavior. Do not claim timestamp support for Bunny until both ingestion and seek playback exist.
21. **Private dataset.** Change `production` from public to private only after confirming the existing read token works. The browser never reads Sanity directly.
22. **Remote deployment is part of this approved task.** After local checks, deploy the hosted Studio and schema, create/update the Context endpoint, set the non-secret endpoint URL locally, and verify with an organization Context Viewer token. Token creation/storage must not be committed or logged in reports.

## 5. Context Endpoint Configuration

Create or update `vertex-search` with:

```text
title: Vertex Search
project: x33ap7fq
dataset: production
workspace: default
perspective: published
semanticSearch: false
groqFilter: _type in ["course", "lesson", "video"]
```

Use concise instructions equivalent to:

```text
Vertex search returns grounded lesson topics and video moments.

- Lessons do not store their parent course. Find courses with `references(lessonId)`, then locate the lesson reference inside ordered `modules[].lessons[]`; derive module and lesson numbers from array position.
- Match lesson topics against `title`, `keyPoints`, and `pt::text(notes)`. Text matching is token based: wildcard each meaningful query token and OR the token conditions. Never match the user's whole phrase as one pattern.
- Video documents join to lessons by exact `video.url == lesson.videoUrl`. They are internal lookup documents and are never standalone results.
- For each video, match `chapters[].label` first. Query `chunks` only when that video has no relevant chapter match. Project only matching chunks, a few per video; never return a whole transcript.
- Rank exact title concepts above chapter matches, chapter matches above broad lesson-topic matches, and transcript fallback last.
- Return every relevant lesson and verified video moment, not a fixed top-N. Never invent IDs, slugs, timestamps, durations, counts, or content.
```

## 6. Files Expected To Touch

### Prompt and dependencies

- `prompts/vertex-intelligent-search.md`: this approved contract.
- `package.json` / `package-lock.json`: add compatible majors `ai@^7`, `@ai-sdk/mcp@^2`, `@ai-sdk/openai@^4`, and direct `zod@^4`.
- `.env.example`: add `SANITY_ORGANIZATION_TOKEN` and `OPENAI_SEARCH_MODEL`; clarify all Context/OpenAI values are server-only.

### Studio schema

- `studio/schemaTypes/documents/video.ts`: internal video lookup document.
- `studio/schemaTypes/objects/video-chapter.ts`: `{startSeconds, label}`.
- `studio/schemaTypes/objects/video-chunk.ts`: `{startSeconds, text}`.
- `studio/schemaTypes/index.ts`: register the new types.
- `studio/structure.ts`: add an internal `Videos` list after Lessons.
- `sanity.types.ts`: regenerate, never hand-edit.

### Search server

- `app/api/search/route.ts`: validated POST route and safe NDJSON response.
- `lib/search/schema.ts`: request, model-selector, stream-event, and verified result schemas/types.
- `lib/search/context.ts`: server-only environment validation, trusted MCP URL validation, initial-context cache, client/tool setup, and cleanup helpers.
- `lib/search/prompt.ts`: concise system prompt with duplicated critical query/ranking rules and injection boundary.
- `lib/search/search.ts`: OpenAI/MCP orchestration, selector collection, deterministic grounding, dedupe, ranking, and verified response construction.
- `sanity/lib/search.ts`: search hydration GROQ and server-only data helper, kept separate from pending `queries.ts`/`data.ts` edits.

### Search UI

- `app/search/page.tsx`: metadata, async `searchParams`, page shell, and `Suspense` boundary.
- `components/search/SearchExperience.tsx`: GET search form, API request/abort/NDJSON handling, states, sort control, result count, and analytics.
- `components/search/SearchResultCard.tsx`: responsive video and lesson card variants using real card DTOs.
- `components/search/HomeSearchForm.tsx`: add `required`, sensible `minLength`/`maxLength`, and preserve native GET navigation and current styling.

Avoid changing `sanity/lib/queries.ts`, `sanity/lib/data.ts`, lesson components, shared icons, or prototype cards unless implementation proves a small compatibility change is required. Preserve all pre-existing dirty work.

## 7. Requirements

### 7.1 Video content model

Use `defineType`, `defineField`, and `defineArrayMember` with Studio icons and previews.

`video` document:

- Internal-only document type; title/description explain that ingestion owns it.
- `id`: required provider/external ID string.
- `url`: required unique provider URL string/URL used for exact lesson joining.
- `chapters`: ordered array of `videoChapter`; may be empty when the source has no chapters.
- `chunks`: ordered array of short `videoChunk` transcript pieces; never one full-transcript field.
- Validate integer, non-negative starts and reject duplicate/non-ascending start values.
- Ingestion may use a deterministic document ID derived from normalized video URL as required by the project, but this search task does not create fabricated video documents.

`videoChapter`:

- `startSeconds`: required non-negative integer.
- `label`: required concise string.

`videoChunk`:

- `startSeconds`: required non-negative integer.
- `text`: required short text with a defensive maximum length.

### 7.2 MCP and OpenAI server integration

- Import `server-only` in every module that reads Context/OpenAI secrets.
- Validate configuration once with clear server-side errors:
  - `SANITY_CONTEXT_MCP_URL`
  - `SANITY_ORGANIZATION_TOKEN`
  - `OPENAI_API_KEY`
  - `OPENAI_SEARCH_MODEL` or documented default.
- Validate the configured MCP URL is HTTPS on `api.sanity.io`, has no credentials, and uses the expected Context organization endpoint path before attaching the organization token.
- Fetch MCP client and `/initial-context` in parallel.
- Cache successful initial context for five minutes in warm instances. Do not cache failure.
- Remove `initial_context` only when the payload was successfully inlined; otherwise retain it.
- Pass only the dataset read tools needed for search (`initial_context` fallback, `schema_explorer`, `groq_query`, `array_field_reader`), not future unknown tools.
- Use `streamText` with OpenAI, `Output.object({schema})`, and a finite step limit high enough for lesson and chapter/transcript queries.
- Set OpenAI storage off where supported. Never log prompts, raw learner queries, MCP results, transcript text, tokens, or API keys.
- Put the untrusted learner query in a clearly delimited user payload and explicitly tell the model it is search text, not instructions.
- Close the MCP client on success, abort, and error.

### 7.3 Grounding and ranking

- Zod validation proves shape only. Treat all model selectors as untrusted.
- Hydrate selected IDs through the existing private Sanity client and published perspective.
- Verify:
  - selected course exists;
  - selected lesson exists and has a slug;
  - selected module key exists on that course;
  - that module contains the lesson reference;
  - selected video exists and its URL exactly matches the lesson's `videoUrl`;
  - selected `startSeconds` exactly exists in the claimed chapter/chunk source.
- Drop invalid, stale, cross-course, or unverifiable selectors silently; never repair by guessing.
- Derive module/lesson numbers from ordered arrays.
- Build URLs on the server from verified slugs only.
- Build video links as `/lessons/{slug}?start={startSeconds}`.
- Build lesson links as `/lessons/{slug}`.
- Derive video clip length from the next chapter/chunk start, falling back to the verified lesson duration minus the start. Never produce a negative/zero clip length.
- Derive result descriptions and labels only from stored content.
- Deduplicate lesson IDs and duplicate video start moments.
- Compute total results and unique-course count from the final verified array.
- Preserve all verified results; do not paginate or truncate this dataset-sized response.

### 7.4 API contract and safety

- `POST /api/search` accepts JSON `{query: string}` only.
- Trim whitespace; require 2-200 characters; reject extra properties and wrong content type.
- Reject malformed input before opening MCP/OpenAI connections.
- Export a finite route duration suitable for the deployment platform and forward `request.signal` to abort upstream work.
- Respond with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Stream NDJSON events that validate against the shared event schema:
  - status event with a fixed server-authored phase, no model text;
  - results event with verified response;
  - safe error event with retryable boolean.
- Never expose stack traces, MCP response bodies, provider errors, environment names, endpoint URL, tool inputs/results, or ungrounded output.
- Distinguish 400/415 validation errors from 500 configuration/upstream failures when headers have not yet streamed.

### 7.5 Results page

- Preserve the established SiteHeader and warm cream/peach Vertex visual language. No unrelated redesign.
- One `h1`; semantic search form; labeled input; visible keyboard focus.
- Keep `q` in the URL through a native GET form so results are linkable and browser navigation works.
- Show helpful initial state when `q` is absent.
- Show a meaningful skeleton/status while searching and `aria-live` status text.
- Show `Found {n} results across {m} courses` from verified server counts.
- Default sort is `Most Relevant`; course/type sorts are deterministic and client-only.
- Video card includes:
  - `VIDEO` badge;
  - course name/icon or monogram fallback;
  - lesson title and derived `Lesson n.m in {module}` label;
  - lesson thumbnail;
  - verified moment label/description;
  - matched timestamp and derived clip length;
  - `Watch from {timestamp}` link to the on-site lesson player.
- Lesson card includes:
  - `LESSON` badge;
  - course name/icon or monogram fallback;
  - lesson title and derived module/lesson label;
  - grounded description and stored key points;
  - `View lesson` link.
- Empty state says no matching lessons were found and links to `/courses`.
- Error state is concise, keeps the query in the input, offers Retry, and does not reveal internals.
- Responsive behavior: one column on mobile, readable result layout at tablet, richer thumbnail/content grid on desktop, no horizontal overflow at 375/768/1024 widths.
- Result links remain ordinary links and work without JavaScript after results have loaded.

### 7.6 Analytics

- Keep existing homepage `search_submitted` behavior.
- Capture `search_performed` once per completed query with:
  - `query_length`, `result_count`, `course_count`, `video_result_count`, `lesson_result_count`, `duration_ms`.
- Do not send raw query text, result descriptions, notes, chapter labels, or transcript chunks in the new event.
- Capture a result-click event with kind, zero-based rank, lesson ID, and course ID only.

### 7.7 Studio, dataset, and endpoint deployment

- Local schema is the source of truth; never use MCP-managed schema deployment.
- Run local Studio typecheck/build and root TypeGen before deployment.
- Confirm `SANITY_API_READ_TOKEN` works before making the dataset private.
- Set `x33ap7fq/production` to private.
- Deploy the hosted Studio with a stable available hostname and `--schema-required`; proposed hostname `vertex-learning-studio`.
- Deploy the schema explicitly from `studio/` after the Studio deploy.
- Create `vertex-search` if absent; update it in place if present. Never create duplicate production endpoints.
- Create/use an organization API token with only Context Viewer access. Store it only in root `.env.local`/deployment secrets, never in Studio or git.
- Put the endpoint URL in `SANITY_CONTEXT_MCP_URL` locally/deployment secrets.
- Verify endpoint status, initial context, tool list, endpoint filter behavior, and one real search against live MCP.

## 8. Security Considerations

- Dataset, Sanity read token, organization token, MCP URL, OpenAI key, and model orchestration remain server-only.
- The browser only calls `/api/search`; it never calls Sanity, Context MCP, or OpenAI.
- The endpoint filter is fixed configuration and cannot be widened by user input.
- Context MCP is read-only and the app exposes no search write path.
- User input never becomes executable GROQ in application code. The model writes GROQ only inside the scoped, read-only Context endpoint.
- Prompt injection in the query cannot override system rules; all returned selectors still fail closed through deterministic hydration.
- Portable Text is converted to plain text server-side for matching/description; no generated/raw HTML is rendered.
- External image URLs come only from the existing Sanity image builder.
- Query, tool, and transcript contents stay out of logs and analytics.
- Public LLM cost is bounded by input length, fixed tool allowlist, finite steps, request cancellation, and provider timeout. Configure a distributed edge/platform rate limit before production traffic.
- Changing the dataset to private must happen only after validating the server read token, preventing an avoidable outage.

## 9. Acceptance Criteria

- `/search?q=context+windows` renders a complete search page instead of 404.
- The browser network path is only `/api/search`; no Context/OpenAI/Sanity token or endpoint appears in client bundles or responses.
- Search uses the live Context MCP `groq_query` tool and OpenAI structured output, not a hard-coded local keyword query pretending to be intelligent search.
- The model output is strict-Zod validated and every card is independently revalidated against live Sanity content.
- Lesson search covers title, key points, and plain-text notes with wildcarded OR token matching.
- Video search is chapter-first and transcript-fallback, never returns a standalone video document, and never reads/returns an entire transcript.
- Exact title concepts rank above broader lesson matches; chapter matches rank above transcript matches.
- Result count and unique-course count exactly match the rendered, verified array.
- Both result card variants render from the shared verified DTO contract; current live content honestly returns lesson-only results until video ingestion creates verified video documents.
- Video result links use `/lessons/{slug}?start={verifiedSeconds}` and play on the existing lesson page for a provider with supported seeking.
- Empty, loading, upstream-error, retry, and no-query states are accessible and responsive.
- Existing `/`, `/courses`, course detail, and pending lesson-page behavior remain intact.
- Dataset is private, hosted Studio/schema are deployed, and `vertex-search` status/tools/initial context verify successfully.
- Root typecheck, lint, production build, Studio typecheck/build, TypeGen, and dev-server smoke checks pass.
- No fabricated video/transcript fixture is added merely to make the UI look populated.

## 10. Checks To Run

Run and report real output, in this order where dependencies apply:

1. `npm install` after dependency changes.
2. `npm run typecheck:studio`.
3. `npm run typegen`.
4. `npm run typecheck`.
5. `npm run lint`.
6. `npm run build:studio`.
7. `npm run build`.
8. Start `npm run dev`; request `/`, `/courses`, a real lesson route, `/search`, and `/search?q=context%20windows`; exercise `POST /api/search` with valid, empty, overlong, malformed JSON, and wrong-content-type bodies.
9. `git diff --check`.
10. Confirm the existing Sanity read token can query published courses.
11. Set the dataset private and repeat the server-side content smoke test.
12. From `studio/`, deploy the hosted Studio with schema required, then deploy the schema explicitly.
13. Create/update `vertex-search` with the approved filter/instructions and semantic search disabled.
14. Run Context endpoint status and initial-context commands; call `tools/list` and confirm at least `initial_context` and `groq_query`.
15. Run a live MCP-backed API search and confirm returned IDs/counts against a direct projected Sanity query.
16. If a verified video document exists, search a chapter concept and verify the exact start; otherwise report that the live video branch is awaiting ingestion rather than fabricating data.
17. Run the Next.js agent-feedback reporting pass required by `AGENTS.md` before the final response if any qualifying Next.js friction occurred.

## 11. Exact Manual Test Steps

1. Put server-only values in root `.env.local`: `SANITY_CONTEXT_MCP_URL`, `SANITY_ORGANIZATION_TOKEN`, `OPENAI_API_KEY`, and optionally `OPENAI_SEARCH_MODEL`. Do not add them to Studio env.
2. Run `npm run dev`, open `/`, enter `context windows`, and submit.
3. Confirm the URL becomes `/search?q=context+windows`, the header/page shell renders immediately, and the loading status updates without exposing model prose.
4. Confirm the final heading reads the actual result/course counts and every rendered card is a real published lesson from Sanity.
5. Confirm exact lesson-title matches appear before broader notes/key-point matches.
6. Change the sort to Course and Result Type; confirm counts and card membership stay unchanged. Return to Most Relevant and confirm canonical order is restored.
7. Open a lesson result; confirm it navigates to `/lessons/{real-slug}`.
8. With a verified video document present, search a chapter label, confirm a VIDEO card appears, and open `Watch from ...`; confirm the URL contains the stored second and the provider player starts there. Confirm a transcript match is used only when no chapter matched that video.
9. Search nonsense text; confirm the empty state links to `/courses` and no course/lesson/timestamp is invented.
10. Disconnect or invalidate Context configuration in local env, retry, and confirm the safe error state contains no endpoint, token, stack, provider body, or MCP tool details. Restore configuration.
11. Submit one-character, 201-character, whitespace-only, and valid Unicode queries; confirm validation and input limits behave predictably.
12. Change `q` rapidly or navigate back during a search; confirm the stale request aborts and does not overwrite the newest results.
13. Inspect browser devtools: no direct request to `api.sanity.io` or OpenAI, no server secret in HTML/JS/NDJSON, and no raw transcript array in the response.
14. Inspect PostHog debug output: one `search_performed` event with counts/latency/query length and no raw query text from the new completion event; result clicks contain IDs/kind/rank only.
15. Navigate and operate the page using keyboard only; confirm input, sort, retry, catalog link, and every result link have visible focus and status changes are announced.
16. Resize to 375px, 768px, and 1024px; confirm cards remain readable, thumbnails scale, controls stack sensibly, and no horizontal scrollbar appears.
17. Open the deployed Studio and confirm Videos exists with validated chapter/chunk arrays. Confirm the Context endpoint in the Dashboard shows the approved dataset, published perspective, filter, instructions, and semantic search off.
