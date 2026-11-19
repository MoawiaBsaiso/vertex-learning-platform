# Implementation Prompt: Vertex Course Detail Page

## 1. Goal

Implement the course detail page at `/courses/[slug]` from `design/vertex-course.png` with high visual fidelity at the reference viewport (`1024x1536`) and sensible responsive behavior down to mobile. The page is data-driven: it renders the already-published Sanity courses through the existing server-only data layer, not the mock copy in the screenshot.

The work is presentational. It does not add search, progress tracking, bookmark persistence, analytics, or new Sanity queries/schema.

## 2. Skills And Docs Read

- `AGENTS.md`: project workflow, UI fidelity rules, server/client and token boundaries, scope, verification rules.
- `sanity-best-practices` skill:
  - `references/nextjs.md`: `next-sanity` setup, `sanityFetch` with `'use cache'`/`cacheTag`, TypeGen result types, server-only data access.
  - `references/image.md`: `urlFor` + `next/image` pattern; request exact sizes from the Sanity CDN.
- Next.js docs (`node_modules/next/dist/docs/`):
  - `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`: `params` is a Promise; `await params` in the page.
  - `01-app/03-api-reference/04-functions/generate-static-params.md`: prerender known slugs; required for static rendering under Cache Components.
  - `01-app/03-api-reference/04-functions/generate-metadata.md`: per-route metadata from server data.
  - `01-app/01-getting-started/12-images.md`: `images.remotePatterns` for remote hosts.
- No Clerk, PostHog, search, or migration skill is needed: auth wiring already exists in the header and this task adds no new integration.

## 3. Code Inspected

- `package.json`: scripts `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), `build`; no icon/UI dependencies.
- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`; no `images` config yet.
- `app/page.tsx` (lines 171–243): the full inline site header (logo, Courses/My Learning nav, Bell, Clerk `Show`/`Suspense`/`UserButton`, `vertexUserAvatar`); a private inline `ArrowRight` SVG elsewhere in the file.
- `app/home.css`: `vertexHomeCanvas` (cream canvas, `overflow-x: hidden`), `vertexHomeFrame` (`#fffdfb` + radial peach glow), skyline, and the `.vertexUserAvatar` rules (lines 99–110).
- `app/globals.css`: `--font-sans` (Inter) and `--font-display` (Playfair) tokens; body defaults to `font-sans`.
- `app/layout.tsx`: `next/font` loads Inter + Playfair into CSS variables.
- `components/icons/VertexIcons.tsx`: existing icon set (VertexLogo, Bell, Search, PlayCircle, Document, Bookmark outline/filled, BarChart, Clock, User, Chevrons, ExternalLink, Folder, InProgress, CheckCircle, Lock, Eye, Grid, Target, Accessibility). Missing for this page: arrow-right, users, and the outcome icons.
- `components/ui/Button.tsx`: fixed `font-sans`, `h-[44px]`, `text-[14px]` base classes — conflicts with the reference's serif ~48px buttons if overridden via `className` (Tailwind conflict order is not class-order dependent).
- `components/ui/Badge.tsx`: `popular` variant is white with a coral border; the reference badge is peach-filled with coral text.
- `components/ui/ProgressBar.tsx`: `value`, `showLabel`, `labelSuffix`; `h-2` track, `bg-primary-500` fill — matches the reference bar.
- `components/navigation/Navigation.tsx`: marked `"use client"`; `Breadcrumbs` renders `text-[13px]` sans, `aria-current="page"` on the last item; used by `DesignSystemShowcase`, so defaults must not change.
- `sanity/lib/client.ts`: `sanityFetch` is `'use cache'` + `cacheLife('minutes')` + `cacheTag`, `stega: false`, token via `server-only` module.
- `sanity/lib/data.ts`: `getCourseBySlug` (adds `moduleCount`, `lessonCount`, `durationLabel` via `withCourseStats`), `getCourseSlugs`.
- `sanity/lib/queries.ts`: `COURSE_BY_SLUG_QUERY` already projects everything this page needs (`slug` as a string, `learningOutcomes`, `modules[].lessons[]` with `title`/`slug`/`duration`); no query changes.
- `sanity/lib/format.ts`: `formatDuration` → `45m`, `1h 12m`, `18h 24m`.
- `design/vertex-course.png` plus crops of header, hero, outcomes, course content, and sticky bar (regions analyzed at pixel level).
- `prompts/vertex-home-page.md`: prompt structure and the home page's conventions (page-scoped CSS, future-facing links, no new dependencies).
- Sanity MCP (`x33ap7fq` / `production`): 10 published courses, every course has exactly 4 modules; `popular: true` on 4 of them; outcome `icon` values in use: `layers`, `code`, `clock`, `rocket`, `shield`, `target` (schema enum also allows `database`, `terminal`, `book`).

## 4. Decisions And Assumptions

1. **Route and page API.** `app/courses/[slug]/page.tsx` is a Server Component. `await params`; `generateStaticParams()` returns `getCourseSlugs()` (all 10 seeded courses prerender); unknown slug → `notFound()`; `generateMetadata()` returns `{ title: \`${course.title} | Vertex\`, description: course.summary }`. Data comes from the existing `getCourseBySlug`/`getCourseSlugs`, which are already `'use cache'` — no new fetching. If the build requires it under Cache Components, wrap the data-dependent subtree in `Suspense`; prefer the direct await since every slug is prerendered.
2. **Real data, not mock copy.** The screenshot's "Next.js for Production", 12 modules, 18h 24m, 2.1k students, and the mock outcome titles are reference-only. Render the seeded document's title, summary, cover, level, `popular`, `studentCount`, `learningOutcomes`, and modules. Derived values: level capitalized (`intermediate` → `Intermediate`); course meta `N modules • {durationLabel}`; students `≥1000 → X.Xk` (18240 → `18.2k`, else plain count); per-module duration = sum of its lessons' `duration` run through `formatDuration`.
3. **Shared header extraction.** Move the home page's inline `<header>` verbatim into `components/navigation/SiteHeader.tsx` with props `coursesHref?: string` (default `#courses`), `coursesActive?: boolean`, and `font?: 'sans' | 'serif'` (default `sans`). Home passes `coursesActive` and keeps `sans` — it must stay pixel-identical. The course page passes `coursesHref="/#courses"` and `serif`: the course reference renders nav links in Playfair ~17px with wider gaps and an ~88px header (home's is 98px sans 15px). Move the `.vertexUserAvatar` rules from `app/home.css` to `app/globals.css` so both pages share them.
4. **Breadcrumb.** Reuse `Breadcrumbs`, adding an optional `textClassName` prop that replaces only the `ol`'s hardcoded `text-[13px]` (default keeps the design-system showcase unchanged). Course page passes `font-display text-[15px]`. Items: `All Courses` → `/#courses` (works today; swap to `/courses` when the catalog lands), then the course title as the current page.
5. **Typography mapping.** The reference uses Playfair (`font-display`) as the page's primary text face and Inter only for micro-labels. Serif: nav links (course variant), breadcrumb, h1, summary, section headings, outcome titles and descriptions, module titles and summaries, expanded lesson titles, all button labels, "N% complete". Sans: POPULAR badge, hero meta row, module durations, `N modules • duration` meta, "Your Progress" label. (The header stays sans on home per its approved design.)
6. **Buttons and badge are page-local.** The reference CTAs are ~48px tall, 16px serif: `Button`'s fixed `h-[44px]`/`text-[14px]`/`font-sans` cannot be overridden reliably, and the home page already styles its CTAs locally. Render `Continue Learning` (primary coral, `ArrowRightIcon`), `Bookmark` (white, `BookmarkIcon outline`), and `Show all N modules` as page-local elements with the standard focus-ring classes. The POPULAR badge is a page-local span (peach background, coral 11px bold uppercase, `rounded-md`) — do not modify `Badge`. `Button` and `Badge` stay untouched.
7. **Interactive leaves are client components.** `components/course/CourseContent.tsx` (module accordion) and `components/course/BookmarkButton.tsx` (`aria-pressed` visual toggle only — persistence is a future feature). The page itself stays a server component; pass plain serializable props (precompute each module's `durationLabel` and lesson list on the server).
8. **Accordion behavior.** Show the first 6 modules; when a course has more than 6, render a centered `Show all N modules` button below the card that expands the rest and relabels to `Show fewer modules`. Every seeded course has exactly 4 modules, so the button is dormant on current content — implement the rule anyway per the reference. Rows toggle independently; all start collapsed; chevron rotates; `aria-expanded` + `aria-controls`.
9. **Links are future-facing (established pattern).** `Continue Learning` (hero and sticky bar) → first lesson `/lessons/{slug}`; expanded lesson rows → `/lessons/{slug}`. Those routes do not exist yet and will 404, same as `/my-learning` and `/search` from the home page. Do not build them.
10. **Progress is a presentational placeholder.** No progress backend exists. The sticky bar shows `0%` with `ProgressBar value={0} showLabel={false}` plus a local text stack (`Your Progress` / **`0%`** ` complete`). The screenshot's 35% is mock. Wire real data when the progress feature lands.
11. **Images.** Cover and any thumbnails render through `next/image` + `urlFor(...).url()`; add `images.remotePatterns` for `https://cdn.sanity.io` to `next.config.ts` (the only remote host). Cover: ~282×324 container at `lg`, `rounded-2xl`, `object-cover`, alt = course title.
12. **Page-scoped CSS (`app/course.css`), imported for side effects** (same convention as `home.css`; do not use CSS Modules). Contains: `vertexCourseCanvas`/`vertexCourseFrame` (same warm palette as home — canvas `#fffaf7`, frame `#fffdfb` + radial glow), the faint diagonal stripe rails at the left/right page edges visible in the reference (home deliberately has none — keep them page-scoped here), and the bottom decorative blocks (a coral accent bar peeking from the bottom-left edge plus peach translucent rounded blocks at both bottom corners, behind the sticky bar, all `aria-hidden`). Use `overflow-x: clip` — not `hidden`, which would create a scroll container and break `position: sticky`.
13. **Sticky bottom bar.** Last element in the page flow inside the frame: content-width white card (`sticky bottom-0 z-20`, `rounded-xl`, soft shadow), left = text stack + `ProgressBar` (flex-1, `showLabel={false}`), right = `Continue Learning`. Frame gets ~18px bottom padding so the bar rests slightly above the viewport edge at full scroll. On `<sm`, stack the progress block above a full-width CTA.
14. **Layout geometry.** Content container `mx-auto max-w-[1024px] px-5 sm:px-16` (64px side padding at the reference width). Hero grid `lg:grid-cols-[282px_minmax(0,1fr)]` with a ~58px gap; summary capped at ~410px; h1 `text-[52px]` at `lg` scaling down on small screens; section headings ~28px. Spacing between bands (breadcrumb → hero → outcomes card → course content → show-all → sticky bar) tuned side-by-side against the reference.
15. **Outcome icons.** Map every schema enum value to an icon: `code`→Code, `layers`→Layers, `database`→Database, `shield`→Shield, `rocket`→Rocket, `target`→Target (exists), `terminal`→Terminal, `book`→Book, `clock`→Clock (exists). Render ~44px coral outline, left of the text. The reference's gauge/cloud are mock art for values outside the enum; layout and color are what matter. Also add `ArrowRightIcon` and `UsersIcon` (two-person) to `VertexIcons` following the file's existing conventions; leave home's private inline arrow untouched.
16. **Meta row icons:** `BarChartIcon` (level), `ClockIcon` (duration), `DocumentIcon` (modules), `UsersIcon` (students), ~19px, sans 14px labels.
17. **No new npm dependencies, no changes** to Sanity schema/queries/data layer, `Button`, `Badge`, `ProgressBar`, `/design-system`, or Clerk configuration.

## 5. Files Expected To Touch

- `prompts/vertex-course-page.md`: this approved contract.
- `app/courses/[slug]/page.tsx`: new route — params, metadata, `generateStaticParams`, `notFound`, full page composition.
- `app/course.css`: new page-scoped canvas/frame, edge stripes, bottom decorations, sticky-bar support.
- `components/navigation/SiteHeader.tsx`: new shared header extracted from the home page.
- `app/page.tsx`: replace the inline header with `<SiteHeader />` (visually identical).
- `app/home.css`: remove the `.vertexUserAvatar` rules (moved to globals).
- `app/globals.css`: add the `.vertexUserAvatar` rules.
- `components/navigation/Navigation.tsx`: add the optional `textClassName` prop to `Breadcrumbs` (default behavior unchanged).
- `components/course/CourseContent.tsx`: new client accordion (modules, lessons, show-all).
- `components/course/BookmarkButton.tsx`: new client bookmark toggle.
- `components/icons/VertexIcons.tsx`: add `ArrowRightIcon`, `UsersIcon`, and the seven missing outcome icons.
- `next.config.ts`: add `images.remotePatterns` for `cdn.sanity.io`.

## 6. Requirements

### Desktop Fidelity (compare at `1024x1536`)

- **Header:** identical structure to home (logo, Courses, My Learning, Bell, Clerk avatar/sign-in) but with the course reference's serif nav links, ~88px height, and a fine warm-gray bottom divider. Faint diagonal stripe rails visible at the page edges behind it.
- **Breadcrumb band:** `All Courses › {course title}` in Playfair ~15px under the header, in its own band with a second full-width divider below it.
- **Hero:** cover left (rounded, portrait crop); right column: peach POPULAR badge (only when `popular`), Playfair h1, serif summary (~410px max width), sans meta row (level / duration / modules / students with icons), then `Continue Learning` (coral, arrow) + `Bookmark` (outline icon) buttons.
- **What you'll learn:** bordered warm-white card, Playfair heading, 2×2 grid of bordered tiles, each with a coral outline icon, serif title, and serif description — rendered from `learningOutcomes`.
- **Course Content:** Playfair heading with right-aligned sans `N modules • {durationLabel}`; bordered card of module rows: numbered circle, serif title + summary, right-aligned sans duration, chevron. Rows divided by hairlines; expanding a row reveals its lesson links.
- **Show all:** centered outlined serif button with chevron when modules > 6 (dormant on seeded content).
- **Sticky bar:** pinned white card — `Your Progress` / **`0%`** ` complete` + progress bar, coral `Continue Learning` at right — over the peach/coral corner decorations.

### Semantics And Accessibility

- Logical headings: one `h1` (course title), `h2` for both sections, `h3` inside module toggles.
- Accordion buttons expose `aria-expanded`/`aria-controls`; bookmark exposes `aria-pressed`; icon-only controls keep accessible names.
- Breadcrumb uses the shared component's `aria-current="page"`.
- Decorative icons, stripes, and corner blocks are hidden from assistive technology; cover has descriptive alt.
- Visible focus rings on every link and button (match the home page's `focus-visible` ring classes).

### Responsiveness

- No horizontal overflow at `375px`, `768px`, `1024px`, or wider.
- Below `lg`: hero stacks (cover above the text column); outcomes drop to one column below `sm`; module summaries hide below `sm` while title/duration/chevron remain.
- Header wraps like home; sticky bar stacks its progress block above a full-width CTA below `sm`.
- Desktop composition stays exact at `1024px`.

## 7. Security Considerations

- The Sanity read token stays inside `server-only` modules; nothing new reaches the browser. No new environment variables.
- Remote images are restricted to `cdn.sanity.io` via `remotePatterns`.
- No user input is processed or rendered; all links are fixed local destinations.
- No schema, write-token, or Clerk secret changes.

## 8. Acceptance Criteria

- `/courses/{slug}` closely matches `design/vertex-course.png` at `1024x1536`: layout, spacing, typography (serif/sans split), colors, borders, shadows, sticky bar, edge stripes, and corner decorations.
- Every value shown comes from the seeded Sanity document; no mock copy or invented numbers.
- All 10 seeded slugs prerender via `generateStaticParams`; an unknown slug returns 404; metadata shows `{title} | Vertex`.
- `/` is visually unchanged after the header extraction; `/design-system` is unchanged after the `Breadcrumbs` prop addition.
- Usable with keyboard; no horizontal overflow at `375`/`768`/`1024`.
- No new npm dependency; no changes to `Button`, `Badge`, `ProgressBar`, Sanity schema, or queries.
- `npm run typecheck`, `npm run lint`, and `npm run build` complete successfully.
- Dev-server smoke test: `/`, `/design-system`, and two course URLs return 200; an unknown slug returns 404.

## 9. Checks To Run

Run from the repository root and report real output:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. Start `npm run dev` and request `/`, `/design-system`, `/courses/nextjs-app-router-in-depth`, `/courses/building-ai-apps-with-llms` (expect 200) and `/courses/does-not-exist` (expect 404); confirm no terminal runtime errors.
5. Inspect `git diff --check` for whitespace errors.

## 10. Manual Test Steps

1. Run `npm run dev` and open `http://localhost:3000/courses/nextjs-app-router-in-depth` at `1024x1536`.
2. Compare side by side with `design/vertex-course.png`:
   - header height, serif nav, dividers, breadcrumb band;
   - cover size/radius, badge, title, summary width, meta row, both hero buttons;
   - outcomes card padding, 2×2 tiles, coral icons, text styles;
   - course content heading meta, module rows (circle, title, summary, duration, chevron), hairlines;
   - sticky bar layout, progress text, CTA, and the peach/coral corner decorations; edge stripe rails.
3. Expand a module: chevron rotates, lesson links appear; click a lesson and confirm the URL is `/lessons/{slug}` (404 today is expected — the route is future-facing).
4. Click `Bookmark`: `aria-pressed` flips and the icon fills; reload resets (no persistence by design).
5. Click `Continue Learning` in the hero and in the sticky bar: both target the course's first lesson.
6. Tab through the page: breadcrumb, nav, buttons, module toggles, and lesson links all show visible focus.
7. Resize to `768px` and `375px`: hero stacks, tiles go single-column, sticky bar stacks, no horizontal scrollbar.
8. Open `/` and confirm the home page header looks exactly as before; open `/design-system` and confirm the showcase breadcrumbs are unchanged.
9. Sign out / sign in (Clerk): header shows the sign-in buttons or avatar exactly as on home.
10. Note for the reviewer: all seeded courses have 4 modules, so `Show all N modules` will not appear; progress intentionally reads `0%`.
