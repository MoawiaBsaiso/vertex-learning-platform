# Homepage "All Courses" from Sanity

## Goal

Replace the hardcoded `courses` array on the homepage (`app/page.tsx`) with data fetched from the seeded Sanity dataset, keeping the reference design (`design/vertex-home.png` card row) pixel-identical.

## Skills / docs read

- AGENTS.md (workflow, UI rules, checks)
- `node_modules/next/dist/docs/` — App Router data fetching, server components (existing knowledge confirmed by current code)
- Sanity MCP `query_documents` — inspected all 10 seeded courses

## Code inspected

- `app/page.tsx` — inline `const courses = [...]` (3 mock cards), `CourseMark` (Next/Docker/TS brand SVGs), card markup at the `#courses` section
- `sanity/lib/data.ts` — `getCourses()` already exists: runs `COURSES_LIST_QUERY` with tag `course`, maps `withCourseStats` → adds `moduleCount`, `lessonCount`, `durationSeconds`, `durationLabel`
- `sanity/lib/queries.ts` — `COURSES_LIST_QUERY` returns title, slug, summary, coverImage, icon, level, popular, studentCount, modules→lessons→duration; ordered `title asc`
- `studio/schemaTypes/documents/course.ts` — `coverImage` required, `icon` optional image ("Course mark"), `level` enum lowercase, `popular` boolean
- Seed state (live query): 10 courses, **all have `coverImage`, none have `icon`**, 4 flagged `popular`

## Decisions (user-approved in question panel)

1. **Card mark** = the course's `coverImage`, square-cropped into the existing 74×74 rounded (`rx=10`) mark slot. No brand SVGs, no letter tiles.
2. **Which 3** = popular first, then alphabetical title; `slice(0, 3)`. (Seed popular set: Building AI Apps with LLMs, Next.js App Router in Depth, Python for Data Work, TypeScript for Application Developers → first three shown.)
3. **Card becomes a link** to `/courses/[slug]` (detail pages now exist). Entire card is the anchor; visuals unchanged apart from cursor/focus ring. Uses the same `focus-visible` pattern as other links on the page.
4. **Meta row data**: level capitalized (`beginner` → `Beginner`), `durationLabel` from `withCourseStats`, `${moduleCount} modules` — replacing the mock strings (`18h 24m`, `12 modules`).
5. **Delete** the mock `courses` array and the now-unused `CourseMark` component (brand SVGs). `ArrowRight` and `Star` stay (still used).
6. `View all courses` keeps `href="#courses"` — no `/courses` index page exists; out of scope.
7. Page stays a Server Component; `metadata` export unchanged; fetch via existing `getCourses()` (already cached with `'use cache'` + `cacheTag('course')`).

## Files to touch

- `app/page.tsx` — only file expected to change

## Requirements

- `export default async function Home()` calling `await getCourses()`
- Sort: `popular` desc, then `title` asc (stable, explicit comparator); take 3
- Card `key` = `course._id` (not title)
- Mark: `next/image` + `urlFor(coverImage)` square-cropped (`.size(148, 148).fit("crop")` for 2× of 74px), `className="h-[74px] w-[74px] rounded-[10px] object-cover"`, `alt=""` (decorative — title follows), rendered only when `coverImage` exists (schema requires it; guard anyway)
- Keep every existing class on heading, grid, card shell, meta row, and the `mt-auto` footer divider — layout must not shift
- Level capitalization helper local to the page (same pattern as course detail page)
- Card anchor: wrap card content so the `<article>` styling stays identical; add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4` matching page link conventions
- No new components, no new queries — `getCourses()` is sufficient

## Security

- Read-only, server-side fetch through `sanityFetch` (token stays server-only)
- No client-side Sanity access, no new env vars

## Acceptance criteria

- Homepage renders exactly 3 cards from Sanity: popular-first trio, real titles/summaries/levels/durations/module counts
- Card layout, spacing, typography, and meta row match the current design (only data source changes)
- Each card links to its `/courses/[slug]`
- No hardcoded course data remains in `app/page.tsx`
- `CourseMark` and mock array fully removed; no unused-import lint errors

## Checks to run

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build` (page data-fetch changed)
4. Dev smoke: `/` → 200, HTML contains "Building AI Apps with LLMs", "Next.js App Router in Depth", "Python for Data Work"; does NOT contain "Docker Essentials" or "TypeScript Deep Dive" (mock titles); cards contain `/courses/` hrefs
5. `git diff --check`

## Manual test steps

1. `npm run dev`, open `http://localhost:3000`
2. Scroll to **All Courses** — 3 cards: Building AI Apps with LLMs (Intermediate, real duration, N modules), Next.js App Router in Depth, Python for Data Work
3. Each card shows a square-cropped cover thumbnail in the 74px rounded mark slot
4. Click a card → lands on that course's detail page
5. Compare spacing/typography against `design/vertex-home.png` — must be unchanged
