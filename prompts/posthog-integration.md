# PostHog Analytics Integration

## Goal

Add production-style, browser-only PostHog analytics to Vertex without touching the server/Node
instrumentation path and without breaking server components.

## Skills and docs read

- `AGENTS.md` (section 5 boundaries, section 7 analytics decisions, section 12 pitfalls, section 13 checks)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/skipTrailingSlashRedirect.md`
- Installed `posthog-js@1.453.1` and `@posthog/types` config types (`defaults`, `capture_pageview`, `ui_host`)

No design skill is needed; visuals are unchanged.

## Code inspected

- `next.config.ts` (no rewrites today)
- `app/layout.tsx` (ClerkProvider only)
- `app/page.tsx` (server component with a native GET search form to `/search`)
- `app/courses/[slug]/page.tsx` (server component, renders `BookmarkButton`)
- `components/course/BookmarkButton.tsx` (client component, no analytics)
- `components/navigation/SiteHeader.tsx`, `components/course/CourseCard.tsx`
- `.env.example`, `.env.local` (KEY and HOST already set), `package.json` (`posthog-js` already installed)
- `proxy.ts` (Clerk middleware, left untouched)
- No `instrumentation.ts`, no `instrumentation-client.ts`, no existing PostHog code

## Decisions and assumptions

1. **Browser-only init via `instrumentation-client.ts`.** Create only the client instrumentation
   file. No `instrumentation.ts`, so Node never imports `posthog-js`. Init is guarded by
   `NEXT_PUBLIC_POSTHOG_KEY`.
2. **Reverse proxy is the default transport.** `api_host: "/ingest"` and the two rewrites from the
   request, plus `skipTrailingSlashRedirect: true`. The static rewrite is listed first.
3. **`ui_host` uses the EU app host.** `.env.local` currently has
   `NEXT_PUBLIC_POSTHOG_HOST="https://posthog.com"`, while the requested config and rewrites are EU.
   Use `NEXT_PUBLIC_POSTHOG_HOST` when it already points at an `eu.` host, otherwise fall back to
   the required `https://eu.posthog.com`, so both env values are consumed and the requested value
   holds.
4. **Pageviews via SDK config, not manual calls.** `capture_pageview: "history_change"` with
   `defaults: "2026-01-30"` (the defaults snapshot also handles SSR-safe script injection). No manual
   `$pageview` capture, to avoid duplicates.
5. **Clerk identity lives in a small client provider.** Wrap the app with
   `<PostHogProvider>` inside `<ClerkProvider>` in `app/layout.tsx`; it reads `useUser()` and calls
   `posthog.identify(user.id, { email, name })` when loaded/signed in and `posthog.reset()` when
   loaded and signed out. Undefined traits are omitted.
6. **Custom events stay in client components.**
   - `course_viewed`: tiny client component mounted from the course page with
     `{ course_id, course_slug, course_title }`.
   - `course_bookmarked`: capture on the bookmark button when it transitions to pressed, passed
     `courseSlug` from the course page.
   - `search_submitted`: extract the homepage native search form into a client component; capture
     `{ query }` on submit and let the existing GET navigation proceed. The `/search` page is out of
     scope and is not built here.
7. **Duplicate guards.** `course_viewed` captures once per mounted course. Bookmark captures only on
   the off -> on transition. Do not wrap state updates in side effects.
8. Update `.env.example` with the two public PostHog variables, since it is the canonical env list.

## Files expected to change

- `next.config.ts` (add rewrites + `skipTrailingSlashRedirect`)
- `instrumentation-client.ts` (new)
- `components/analytics/PostHogProvider.tsx` (new, client)
- `components/analytics/CourseViewed.tsx` (new, client)
- `components/search/HomeSearchForm.tsx` (new, client)
- `app/layout.tsx` (wrap with provider)
- `app/page.tsx` (use `HomeSearchForm`, drop unused icon import)
- `app/courses/[slug]/page.tsx` (mount `CourseViewed`, pass bookmark props)
- `components/course/BookmarkButton.tsx` (props + capture)
- `.env.example` (document PostHog vars)

## Requirements

- `/ingest/static/:path*` -> `https://eu-assets.i.posthog.com/static/:path*`
- `/ingest/:path*` -> `https://eu.i.posthog.com/:path*`
- `skipTrailingSlashRedirect: true`
- Init with `api_host: "/ingest"`, `ui_host` = EU value per decision 3, `defaults: "2026-01-30"`,
  `capture_pageview: "history_change"`
- Identify with Clerk `user.id` and `{ email, name }`; reset on signed out
- Capture `course_viewed`, `course_bookmarked`, `search_submitted` with grounded, static data only
- No `posthog-js` import in server components; no browser write to content or progress; no private
  keys; only `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` reach the client
- No UI changes beyond moving the existing homepage form markup into a component

## Security considerations

- Browser gets only the public project key and host. No PostHog private key or server token is added.
- Analytics never writes Sanity content or progress.
- Server components only render client analytics components; no PostHog call runs on the server.
- `instrumentation-client.ts` is guarded so a missing key disables analytics instead of throwing.

## Acceptance criteria

- PostHog loads in the browser from `/ingest`, no Node instrumentation hook exists.
- One pageview per App Router navigation, no duplicate manual pageviews.
- Sign-in identifies the Clerk user; sign-out resets.
- Clicking Bookmark fires `course_bookmarked` on activation, opening a course fires
  `course_viewed`, submitting the homepage search fires `search_submitted` with the query.
- Server components still render and typecheck.
- `http://localhost:3000` returns HTTP 200 with no PostHog errors in the dev output/browser console.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build` (config and server boundaries changed)
- `npm run dev`, then `Invoke-WebRequest http://localhost:3000` for status 200
- Inspect dev output for PostHog/rewrite errors; test `/ingest` rewrite through the dev server

## Manual test steps

1. Run `npm run dev` and open `http://localhost:3000`.
2. DevTools Network: confirm requests go to `http://localhost:3000/ingest/...` and return 2xx/3xx,
   not direct `posthog.com` calls.
3. Console: confirm no PostHog errors.
4. Sign in via Clerk, then check PostHog person properties include email/name; sign out and confirm
   the distinct id resets.
5. Open a course, click Bookmark, submit the homepage search, and confirm the three custom events
   appear in PostHog Activity/Live events with the expected properties.
