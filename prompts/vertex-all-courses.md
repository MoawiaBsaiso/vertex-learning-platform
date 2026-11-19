# All Courses page (`/courses`)

## Goal

Add a simple `/courses` index page listing every seeded course, reusing the homepage card design. Wire the existing "Courses" nav links and "View all courses" links to it.

## Code inspected

- `app/page.tsx` — homepage card markup (cover-crop mark, title, summary, meta row), data via `getCourses()`
- `app/courses/[slug]/page.tsx` — detail page (SiteHeader serif variant, breadcrumb)
- `components/navigation/SiteHeader.tsx` — `coursesHref` prop (default `#courses`)
- `sanity/lib/data.ts` — `getCourses()` returns all courses with `moduleCount`, `durationLabel`
- `app/home.css` — card hover styles (`vertexHomeCourseCard`)
- `design/` — only home, course, design-system references exist; no all-courses mock

## Decisions

1. **No new design.** Reuse the homepage course card exactly (same classes, 3-column grid, popular-first then title order), and the serif header used on course detail.
2. **Extract `components/course/CourseCard.tsx`** (server component) so home and `/courses` share one card; home passes its 3, index passes all 10. Avoids duplicated markup.
3. Page is plain: warm background `#fffaf7`, `SiteHeader` (serif, `coursesHref="/courses"`, `coursesActive`), "All Courses" heading with a small result count, card grid, nothing else (no breadcrumb, no decorations, no filters).
4. **Link updates**: `SiteHeader` default `coursesHref` → `/courses`; course detail passes `/courses` for nav and its breadcrumb "All Courses"; homepage "View all courses" → `/courses`. Hero "Explore Courses" stays `#courses`.
5. `metadata`: `All Courses | Vertex`.

## Files

- new `app/courses/page.tsx`
- new `components/course/CourseCard.tsx`
- edit `app/page.tsx` (use CourseCard, "View all courses" href)
- edit `components/navigation/SiteHeader.tsx` (default href)
- edit `app/courses/[slug]/page.tsx` (nav + breadcrumb href)

## Requirements

- `generateMetadata` via static `metadata` export; page is a Server Component using `await getCourses()`
- Sort popular first, then title (same comparator as home)
- Cards link to `/courses/[slug]`, `key` = `_id`, mark = cover image cropped 74×74 rounded-[10px], meta = level / duration / N modules
- Empty state: if no courses, show one short line pointing to the homepage search
- Responsive: 1 col → 2 (md) → 3 (lg), same gaps as home
- No client components, no new queries, no new env vars

## Security

Read-only server-side fetch via existing `getCourses()` (`sanityFetch`, token server-only).

## Acceptance

- `/courses` renders all 10 courses; every card navigates to its detail page
- Home shows the same 3 cards as before via the shared component
- Nav "Courses" and course-detail breadcrumb go to `/courses`
- Typecheck, lint, build pass

## Checks

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build` (new route)
4. Dev smoke: `/courses` 200 with all 10 titles; `/` 200; `/courses/[slug]` 200; `/courses/nope` 404
