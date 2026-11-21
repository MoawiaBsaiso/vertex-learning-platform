# Fix course prerender blocking and ship analytics branch

## Goal
Resolve the Next.js 16 Cache Components `blocking-prerender-dynamic` error on course pages by moving async data work behind explicit `<Suspense>` boundaries, then publish the work on `feature/posthog-analytics`.

## Skills read
- No project skill applies.
- Read installed Next.js 16 docs:
  - `node_modules/next/dist/docs/01-app/02-guides/streaming.md` — pass `params` promise into a child inside `<Suspense>`; prefer explicit boundaries close to dynamic access.
  - `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` — wrap uncached reads in `<Suspense>` to create a static shell.

## Code inspected
- `app/courses/[slug]/page.tsx`: async page awaits `params`, calls `getCourseBySlug`, and renders the full course page with no Suspense boundary.
- `app/courses/page.tsx`: async page calls `getCourses` and renders the catalog with no Suspense boundary.
- `next.config.ts`: `cacheComponents: true` is enabled.
- `sanity/lib/client.ts`: `sanityFetch` uses `'use cache'`, but the page-level awaits still need a boundary under the reported error.
- Git state: on `main`, matching `origin/main`; PR #5 already exists as `Instrument application with PostHog` from `posthog/wizard-01a1f82a679b` targeting `main`.

## Decisions and assumptions
- Keep `generateStaticParams` and `generateMetadata` unchanged.
- In `app/courses/[slug]/page.tsx`, make the default page component synchronous. Pass the `params` promise into a local async child component wrapped by `<Suspense>`; that child awaits `params`, fetches with `getCourseBySlug`, and renders the existing course page markup.
- In `app/courses/page.tsx`, make the default page component synchronous. Move `getCourses`, sorting, and the catalog markup into a local async child wrapped by `<Suspense>`.
- Use small local fallback UI with the existing page classes and “Loading…” text; no new layout system.
- Preserve all current markup, analytics components, metadata, and behavior.
- Do not add code comments.
- PR numbers are assigned by GitHub; PR #5 already exists, so the exact PR action needs the user’s choice before execution.
- Exclude `.env*` from staging; therefore `.env.example` remains modified but uncommitted.
- Exclude `session-ses_e057.md` from staging because it is a generated session transcript, not product code.

## Files expected to touch
- `app/courses/[slug]/page.tsx`
- `app/courses/page.tsx`
- `prompts/fix-course-prerender-and-ship.md`

## Requirements
- Import `Suspense` from `react` in both course pages.
- Course detail page:
  - Default export is a synchronous component receiving `params`.
  - It returns a `<Suspense fallback={...}>` containing the async child.
  - Async child owns `await params`, `getCourseBySlug`, `notFound()`, derived data, and the existing page JSX.
- Courses page:
  - Default export is a synchronous component.
  - It returns a `<Suspense fallback={...}>` containing the async child.
  - Async child owns `getCourses`, sorting, and the existing page JSX.
- Typecheck and lint must pass.
- Production build should be run because route files changed; report real output.

## Security considerations
- Do not stage `.env.local`, `.env.example`, or any other `.env*`.
- Never log or commit private tokens.
- Public PostHog env names may remain documented in the uncommitted `.env.example` only.
- `session-ses_e057.md` is excluded to avoid committing transcript content.

## Acceptance criteria
- No page-level `await` remains in either default page export.
- Async Sanity fetching and rendering live inside Suspense-wrapped async children.
- `npm run typecheck` and `npm run lint` pass.
- Branch `feature/posthog-analytics` exists off `main`, changes are committed except `.env*` and session transcript, branch is pushed, and the chosen PR action is completed.

## Checks to run
- From `C:/Projects/vertex`: `npm run typecheck`
- From `C:/Projects/vertex`: `npm run lint`
- From `C:/Projects/vertex`: `npm run build`
- From `C:/Projects/vertex`: `git status --short` and `git diff --cached --name-only` before commit.

## Manual test steps
- Run `npm run dev`.
- Open `/courses` and confirm the catalog renders.
- Open a known `/courses/<slug>` URL and confirm the course page renders.
- Confirm the `blocking-prerender-dynamic` error no longer appears in dev or build output.
