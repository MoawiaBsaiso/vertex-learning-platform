# Implementation Prompt: Vertex Lesson Page

## 1. Goal

Implement the lesson page at `/lessons/[slug]` from `design/vertext-lesson.png` with high visual fidelity at the reference viewport (`1024x1536`) and sensible responsive behavior down to mobile. The page is data-driven: it renders seeded Sanity lessons through the existing server-only data layer, plays the lesson video on the page via the provider's own embed player, and exposes the authored notes behind the Notes tab (user-confirmed decision).

The work is presentational. It does not add progress tracking, bookmark persistence, note-taking, video-play analytics, new Sanity document types, or search.

## 2. Skills And Docs Read

- `AGENTS.md`: project workflow, UI fidelity rules, server/client and token boundaries, scope, verification rules, section 7 (provider embeds, no custom player; `?start=` deep links; presentational surfaces), section 11/12.
- `sanity-best-practices` skill (quick reference + `references/nextjs.md` patterns via the course page): `sanityFetch` with `'use cache'`/`cacheTag`, TypeGen result types, server-only data access.
- `portable-text-serialization` skill, `rules/react.md`: `@portabletext/react` component mapping, typed `PortableTextComponents` defined at module scope, `types.image` needs an explicit mapper, plain-text extraction for metadata.
- Next.js docs (`node_modules/next/dist/docs/`):
  - `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`: `params` is a Promise; `await params`; with `generateStaticParams` the route prerenders samples.
  - `01-app/03-api-reference/04-functions/use-search-params.md`: client-only hook; a prerendered route must wrap the reading component in `<Suspense>` or the production build fails with the Missing Suspense boundary error; boundary is client-rendered while the rest stays prerendered.
  - `generate-static-params.md` / `generate-metadata.md` patterns as already applied on the course page.
- No Clerk, PostHog-setup, search, or migration skill needed: auth wiring exists in the header; this task adds no new integration beyond the established `CourseViewed` analytics pattern.

## 3. Code Inspected

- `package.json`: scripts `typecheck`, `lint`, `build`, `typegen` (studio extract-schema + `sanity typegen generate`); `@portabletext/react` is NOT installed (stack requires it for notes rendering).
- `next.config.ts`: `cacheComponents: true`, `images.remotePatterns` already allows `cdn.sanity.io`.
- `proxy.ts`: `clerkMiddleware()` with no route protection — lesson pages stay public.
- `app/courses/[slug]/page.tsx`: full reference implementation — Suspense-wrapped async content, `generateStaticParams`, `generateMetadata`, `notFound`, `ctaClasses` (48px serif coral CTA), `formatStudents` (k-format — NOT reused here; the lesson design uses comma grouping), meta row icon pattern, `SiteHeader font="serif" coursesHref="/courses"`, `Breadcrumbs` with `textClassName`.
- `app/course.css`: `vertexCourseCanvas`/`vertexCourseFrame` (cream canvas, frame + radial glow, 52px diagonal stripe rails, hidden below `lg`), peach corner blocks/accent bar (course-page only — the lesson design has a full-width footer band instead; do not render them).
- `components/navigation/SiteHeader.tsx`, `Navigation.tsx` (`Breadcrumbs` supports `textClassName`; non-last items without `href` render as plain spans — used for the module crumb).
- `components/course/CourseContent.tsx`: accordion conventions (`aria-expanded`/`aria-controls`, hover/focus classes) — the sidebar is a different design but follows the same a11y/style idiom.
- `components/course/BookmarkButton.tsx`: client toggle, `aria-pressed`, captures `course_bookmarked`; labeled 48px button — the lesson design is an icon-only ~44px square, so it needs optional props (defaults unchanged).
- `components/ui/ProgressBar.tsx`: `value`, `showLabel` — sidebar uses `value={0} showLabel={false}` (no progress backend, established 0% pattern).
- `components/icons/VertexIcons.tsx`: has CheckCircle, Clock, BarChart, Users, Document, ExternalLink, Chevrons, ArrowRight, PlayCircle, Bookmark. Missing: arrow-left, solid play triangle, lightbulb, GitHub mark.
- `components/analytics/CourseViewed.tsx`: the pattern to mirror for `lesson_viewed`.
- `sanity/lib/queries.ts`: `LESSON_BY_SLUG_QUERY` projects everything the main column needs, but nested `course.modules[].lessons[]` only has `_id/title/slug` — the sidebar and footer need `duration`. `LESSON_SLUGS_QUERY` exists for static params.
- `sanity/lib/data.ts`: `getLessonBySlug` builds `context` via `buildLessonContext` (course meta, module, `lessonLabel` like `5.1`, prev/next with title+slug). The sidebar needs the full module/lesson tree with durations; prev/next need `durationLabel`.
- `sanity/lib/format.ts`: `formatDuration` → `45m`, `1h 12m`.
- `studio/schemaTypes/documents/lesson.ts`: `videoUrl` restricted to YouTube/Vimeo/Bunny hosts; `notes` required blockContent; `keyPoints` 1–6 strings; `proTip` optional text; `resources` (type: pdf/link/repo/code/slides, title, description, url); `freePreview` boolean; `duration` seconds; `studentCount`.
- Sanity MCP (`x33ap7fq` / `production`): 10 courses (4 modules × 3 lessons each ≈ 120 lesson slugs), all `videoUrl`s are `youtube.com/watch`; every `notes` follows intro-paragraph → `h2 "What this lesson covers"` → bullets (same text as `keyPoints`) → outro-paragraph; `proTip` often null; 1–2 `link` resources per lesson; `course.icon` is null on every course; `studentCount` values like 18240 / 3426.
- Design crops measured at pixel level (see geometry in §4). Temp crop files were removed; re-crop from `design/vertext-lesson.png` if needed during the build.

## 4. Decisions And Assumptions

1. **Route and page API.** `app/lessons/[slug]/page.tsx` is a Server Component wrapped in `Suspense` (same shape as the course page). `await params`; `generateStaticParams()` returns `getLessonSlugs()` (~120 slugs prerender); unknown slug → `notFound()`; `generateMetadata()` → `{ title: \`${lesson.title} | Vertex\`, description: first notes paragraph plain text, fallback course summary }`. Data via existing `getLessonBySlug`/`getLessonSlugs`.
2. **Notes tab = authored notes (user-confirmed).** The Notes tab read-only renders the lesson's `notes` Portable Text. The Lesson Content tab carries Overview + key points + pro tip + resources. The tab switch itself is presentational (no editing, no persistence) per AGENTS.md §7.
3. **Dek and Overview sourcing (no invented copy).** Dek under the h1 = `context.module.summary`, falling back to `context.course.summary`, else omitted. Overview = the first `normal`, non-list block of `notes` (rendered through the same Portable Text component map so marks survive). This matches the design's shape (short context line + substantive paragraph) with zero duplication on the Lesson Content tab; the full notes (including their heading/bullets) live only in the Notes tab.
4. **Video = provider embed, never a custom player (AGENTS.md §7).** `LessonVideo` is a client component that renders an iframe inside a black `aspect-video rounded-xl` box. `videoEmbed.ts` parses `videoUrl` and builds the embed src **only for recognized providers** (YouTube `watch?v=`/`youtu.be`/`embed/` → `https://www.youtube.com/embed/{id}?rel=0` + `&start={n}`; Vimeo `vimeo.com/{id}`/`player.vimeo.com/video/{id}` → `https://player.vimeo.com/video/{id}` + `?t={n}`; Bunny `iframe.mediadelivery.net/embed/{lib}/{vid}` → as stored, no start param — documented limitation). Unparseable URL → fall back to the lesson thumbnail (`next/image`) rather than an iframe to a raw URL. `?start=` is read with `useSearchParams`, parsed as an integer, clamped to `[0, duration)`, and applied via the provider's own start parameter — this is the deep-link contract for future search results (§7 of AGENTS.md). The component is wrapped in `<Suspense>` with a black aspect-video fallback (required for prerendered routes). The design's mock player chrome (time scrubber, 1x, CC) is the provider's player in reality; do not rebuild those controls.
5. **Layout geometry (measured at 1024×1536).** Header = `SiteHeader font="serif"` (88px). Body grid inside `mx-auto max-w-[1024px] px-5 sm:px-16`: sidebar card occupies ≈ x74–311 (target column ~247px + card inset ~10px), gap ≈35px, main column ≈ x346–956 (~610px). Main column: breadcrumb y≈118–138 (sans 14px — NOT the course page's serif; items: `All Courses` → `/courses`, course title → `/courses/{slug}`, module title plain, lesson title current) with a hairline divider below spanning the main column; LESSON badge y≈171–190 (peach `#FDEAE2`, coral text, sans bold 11px uppercase, rounded); h1 Playfair ~52px; dek sans 16px `#596171` max-w ~460px; meta row sans 14px (Clock→duration, BarChart→Level capitalized, Users→`studentCount.toLocaleString("en-US")` + ` students`); video y≈381–731 (full main width, `aspect-video`, rounded ~12px, black); tabs y≈765–799 (labels ~15px, active = coral text + 2–3px coral underline riding the full-width hairline at y≈798); Overview/`In this lesson you will:`/Resources headings Playfair ~24px/~17px; hairline dividers before the checklist and before Resources; Pro Tip box peach `#FDF1EC` rounded ~12px with coral bulb icon; Resources = 3-column card grid (gap ~16px, cards ~195px: border `#EBE1DB`, white, rounded ~10px, doc/GitHub icon left, bold ~13px title, ~12px gray description, ExternalLink right). Footer band y1442–1536 (full-bleed, `border-t`, bg `#FFFDFB`, inner `px-5 sm:px-14`, content 56→968): left = outlined `← Previous Lesson` serif button + prev title (sans bold 13) / duration (gray 13); right = next title/duration right-aligned + coral `Next Lesson →` serif CTA (~44–48px tall, x≈817–967). Tune all spacing side-by-side against the reference during the build.
6. **Sidebar (`LessonSidebar`, client).** Top: `← Back to course` → `/courses/{slug}` (coral, serif ~15px, x-aligned with card content at ~74). One bordered white card (`rounded-[14px] border #EBE1DB`) containing: course block — black rounded-xl ~64px monogram tile (first letter of course title in Playfair white; `course.icon` is null everywhere, so a monogram is the derived fallback matching the design's "N") + title (sans bold 14) + `0% complete` (sans 12 gray) + `ProgressBar value={0} showLabel={false}` (narrow, under the text block); hairline; `Module {n} of {m}` row (sans semibold 14 + chevron, `aria-expanded` toggling the whole list, default open); hairline; module rows — numbered circle 28px (current module = coral fill/white number, else warm border), title sans medium 14 with durationLabel below (sans 12 gray), right side = chevron (up when open) and a coral CheckCircle **only when completed** (no progress backend today, so no checks render — the design's checks/35% are mock); expanded module reveals lesson rows on a vertical timeline: dot markers (current lesson = filled coral dot, others = hollow ring), title + duration below (current lesson shows coral `Now playing` instead of the duration), current lesson also gets a coral circle ~28px with a white play triangle and is marked `aria-current="page"`; all lessons are links to `/lessons/{slug}`. Current module + its panel start open; rows toggle independently with `aria-expanded`/`aria-controls`. `context === null` (orphan lesson) → render the page without sidebar and without the prev/next footer.
7. **Tabs (`LessonTabs`, client).** `role="tablist"` with two buttons (`Lesson Content`, `Notes`), ArrowLeft/ArrowRight keyboard support, `aria-selected`/`aria-controls`/ids, coral active underline; panels `role="tabpanel"`. Lesson Content panel: Overview (first normal notes block), `In this lesson you will:` checklist (`CheckCircleIcon` coral 20px + `keyPoints`), Pro Tip box (only when `proTip`), Resources grid (type→icon: `repo`→GitHub mark, else Document; cards are `<a target="_blank" rel="noopener noreferrer">` with focus rings). Notes panel: full `notes` via `PortableText` with a module-scope `PortableTextComponents` map — block styles (h2/h3/blockquote → Tailwind typography), bullet/numbered lists, `code` decorator, `link` annotation (`target=_blank rel=noopener noreferrer`), `types.image` mapper (`urlFor` + `next/image`, alt fallback), `onMissingComponent: false`. All props are plain serializable JSON from the query (page stays a server component).
8. **Bookmark.** Extend `BookmarkButton` with optional `iconOnly?: boolean` and `ariaLabel?: string` (defaults keep the course page byte-identical). Icon-only mode renders the ~44px white square with border and coral bookmark icon (`aria-pressed` toggle, label "Bookmark this lesson"), passing `courseSlug`/`courseTitle` so the existing `course_bookmarked` capture still fires. No new event, no persistence (resets on reload — established pattern).
9. **Analytics.** New `components/analytics/LessonViewed.tsx` mirroring `CourseViewed` (ref-guarded `useEffect`): `lesson_viewed` with `lesson_id`, `lesson_slug`, `lesson_title`, `course_id`, `course_slug`. Video-play / watch-depth events are explicitly out of scope (they belong to the progress/analytics feature and need player postMessage work).
10. **Progress surfaces are placeholders.** Sidebar shows `0% complete` with `ProgressBar value={0}`; no completion checkmarks. Wire real data when the progress feature lands.
11. **Query + TypeGen.** Add `duration` to the nested `lessons[]->` projection in `LESSON_BY_SLUG_QUERY`. Extend `buildLessonContext` to also return: `modules[]` (`_key`, title, `durationLabel` = sum of lesson durations, `lessons[]` with `_id`/title/slug/`durationLabel`) for the sidebar, `currentLessonId`, and `durationLabel` on `previousLesson`/`nextLesson` for the footer. Run `npm run typegen` so `sanity.types.ts` picks up the projection change; existing types flow through automatically. No schema changes, no new queries.
12. **Free preview badge (presentational).** When `freePreview` is true, render a second peach badge (`Free preview`) beside the LESSON badge — label only, no access control (AGENTS.md §7).
13. **CSS.** Reuse `app/course.css` imported for side effects (`vertexCourseCanvas`/`vertexCourseFrame` give the cream canvas, radial glow, and stripe rails). No new CSS file expected; the corner blocks/accent bar are NOT rendered (footer band replaces them). Layout is Tailwind.
14. **Icons added to `VertexIcons.tsx`** (following the file's existing conventions): `ArrowLeftIcon` (Back to course, Previous Lesson), `PlayIcon` (solid triangle for the now-playing button), `BulbIcon` (Pro Tip), `GithubIcon` (repo resources). Existing: CheckCircle, Clock, BarChart, Users, Document, ExternalLink, ChevronDown, ArrowRight, Bookmark.
15. **No new npm dependencies except `@portabletext/react`** (named in the AGENTS.md stack; required to render `notes`). No changes to Sanity schema, `Button`, `Badge`, the course/home pages, Clerk, middleware, or `next.config.ts`.

## 5. Files Expected To Touch

- `prompts/vertex-lesson-page.md`: this approved contract.
- `app/lessons/[slug]/page.tsx`: new route — params, metadata, static params, composition (header, sidebar, main column, footer band), Suspense around the video.
- `components/lesson/LessonSidebar.tsx`: new client sidebar (monogram, progress, module accordion, timeline lessons, now playing).
- `components/lesson/LessonVideo.tsx`: new client iframe player (`useSearchParams` + Suspense).
- `components/lesson/videoEmbed.ts`: new pure provider parser/builder (allowlisted hosts only).
- `components/lesson/LessonTabs.tsx`: new client tabs + Lesson Content panel + Notes panel + module-scope Portable Text components.
- `components/analytics/LessonViewed.tsx`: new `lesson_viewed` capture.
- `components/course/BookmarkButton.tsx`: add optional `iconOnly`/`ariaLabel` (defaults unchanged).
- `components/icons/VertexIcons.tsx`: add `ArrowLeftIcon`, `PlayIcon`, `BulbIcon`, `GithubIcon`.
- `sanity/lib/queries.ts`: add `duration` to nested lessons in `LESSON_BY_SLUG_QUERY`.
- `sanity/lib/data.ts`: extend `buildLessonContext` (modules tree, `currentLessonId`, prev/next `durationLabel`).
- `sanity.types.ts`: regenerated via `npm run typegen`.
- `package.json` / `package-lock.json`: add `@portabletext/react`.

## 6. Requirements

### Desktop Fidelity (compare at `1024x1536`)

- **Header:** identical to the course page (serif nav, 88px, divider), stripe rails visible at the page edges.
- **Sidebar:** Back-to-course link; bordered card with black monogram tile, course title, `0% complete` + thin progress bar; `Module {n} of {m}` toggle row; numbered module rows with durations and chevrons; current module expanded with timeline dots, `Now playing` coral label, coral play button on the current lesson; hairline dividers between rows.
- **Main column:** sans breadcrumb + hairline; peach `LESSON {n.m}` badge (+ optional Free preview badge); Playfair h1 with icon-only bookmark at the right; sans dek; meta row (duration / level / comma-grouped students); full-width black rounded video embed; tab bar with coral active underline; Overview paragraph; hairline; `In this lesson you will:` checklist with coral checks; hairline; peach Pro Tip box (when present); Resources heading + 3-card grid.
- **Footer band:** full-bleed white band with top border — outlined Previous button + prev title/duration at left, next title/duration + coral Next button at right; omit a side entirely when there is no previous/next lesson.
- **Content:** every value comes from the seeded document — no mock copy, no invented numbers. Mock-only visuals (35% progress, completion checks, 12-module sidebar, custom player chrome) are rendered from real state or delegated to the provider player.

### Semantics And Accessibility

- One `h1` (lesson title); `h2` for Overview / In this lesson you will / Resources; sidebar course title can be an `h2`; module toggles are buttons with `aria-expanded`/`aria-controls`; tabs implement the tab pattern (`tablist`/`tab`/`tabpanel`, `aria-selected`, arrow keys); bookmark exposes `aria-pressed`; current lesson link `aria-current="page"`; iframe has a descriptive `title`.
- Breadcrumb uses `aria-current="page"` on the last item (shared component).
- Decorative icons/stripes are `aria-hidden`; monogram tile is decorative text (aria-hidden) beside the real title.
- Visible focus rings on every link/button (match existing `focus-visible` ring classes); resource links open in a new tab with `rel="noopener noreferrer"`.

### Responsiveness

- No horizontal overflow at `375`, `768`, `1024`, or wider.
- Below `lg`: stack — sidebar block above the main content (same card, collapsible via the `Module {n} of {m}` row), video full-width, Resources cards to one column, footer band stacks (prev row then next row).
- Desktop composition stays exact at `1024px`.

## 7. Security Considerations

- Sanity read token stays in `server-only` modules; nothing new reaches the browser; no new environment variables.
- Iframe `src` is constructed only from the parsed, allowlisted provider hosts — never a raw stored URL; unparseable URLs render the thumbnail instead.
- `?start=` is sanitized (integer, clamped) before it reaches the embed URL.
- Resource links are external: `target="_blank" rel="noopener noreferrer"`.
- No schema, write-token, Clerk, or middleware changes; the route is public browsing content.

## 8. Acceptance Criteria

- `/lessons/{slug}` closely matches `design/vertext-lesson.png` at `1024x1536`: layout, spacing, typography split, colors, sidebar timeline, tabs, cards, footer band, stripe rails.
- The lesson video plays on the page through the provider embed; `?start=600` starts YouTube near 10:00.
- Every displayed value comes from the seeded Sanity document; Notes tab renders the authored `notes`; Overview/dek derive from module summary + first notes paragraph.
- All seeded lesson slugs prerender; unknown slug → 404; metadata title `{lesson} | Vertex`.
- `/`, `/courses`, `/courses/{slug}`, and `/design-system` are visually unchanged; `BookmarkButton` defaults unchanged for the course page.
- Usable with keyboard; no horizontal overflow at `375`/`768`/`1024`.
- Only new dependency: `@portabletext/react`; no schema/query-shape changes beyond the nested `duration` field.
- `npm run typegen`, `npm run typecheck`, `npm run lint`, and `npm run build` complete successfully.

## 9. Checks To Run

Run from the repository root and report real output:

1. `npm run typegen` (after the query edit; confirm `sanity.types.ts` updates)
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. Start `npm run dev` and request `/`, `/courses`, `/courses/nextjs-app-router-in-depth`, a real lesson URL (expect 200), `/lessons/does-not-exist` (expect 404); confirm no terminal runtime errors.
6. `git diff --check` for whitespace errors.

## 10. Manual Test Steps

1. Run `npm run dev` and open a seeded lesson (e.g. `/lessons/nextjs-app-router-in-depth-caching-and-revalidation`) at `1024x1536`.
2. Compare side by side with `design/vertext-lesson.png`: header; sidebar card (monogram, progress, module rows, timeline dots, now playing, play button); breadcrumb + badge + h1 + bookmark; dek + meta row; video box; tabs + underline; Overview/checklist/Pro Tip/Resources; footer band buttons and info blocks; stripe rails.
3. Click play: the YouTube player loads and plays inside the page; confirm no navigation away from the site.
4. Open the same URL with `?start=600`: playback starts at ~10:00 (YouTube `start` param).
5. Switch tabs: Notes shows the authored notes (heading, bullets, links); arrow keys move between tabs; `aria-selected` updates.
6. Sidebar: toggle a module (chevron rotates, panel opens/closes); click a sibling lesson and confirm navigation; confirm the current lesson shows `Now playing` + `aria-current` and its module is open by default.
7. Footer: Previous/Next navigate to adjacent lessons; on the course's first lesson the Previous side is absent; on the last, the Next side is absent.
8. Click the bookmark: `aria-pressed` flips, icon fills; reload resets (no persistence by design).
9. Tab through the page: back link, module toggles, tabs, bookmark, resource cards, footer buttons all show visible focus.
10. Resize to `768px` and `375px`: sidebar stacks above content, resources go single-column, footer stacks, no horizontal scrollbar.
11. Sign out / sign in (Clerk): header renders exactly as on the course page.
12. Note for the reviewer: progress intentionally reads `0%` with no completion checks; seeded courses have 4 modules (design mock shows 12); Bunny videos (none seeded) render without a seek parameter.
