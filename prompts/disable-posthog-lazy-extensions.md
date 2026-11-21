# Disable unused PostHog lazy extensions

## Goal
Stop PostHog from lazy-loading three unused optional bundles that produce console errors: session recording, dead clicks, and web vitals/performance.

## Skills read
- No project skill applies.
- Checked installed PostHog config types in `node_modules/@posthog/types/dist/posthog-config.d.ts` (`disable_session_recording`, `capture_dead_clicks`, `capture_performance`).

## Code inspected
- `instrumentation-client.ts`: root browser-only `posthog.init(...)` with `api_host`, `ui_host`, `defaults`, and `capture_pageview`.
- `prompts/posthog-integration.md`: prior approved PostHog integration prompt.

## Decisions and assumptions
- Keep browser-only PostHog initialization unchanged except for three init options.
- Do not investigate network traces or change `next.config.ts`, env vars, components, or rewrites.
- `capture_performance: false` disables network timing and web vitals; that is acceptable because performance analytics are unused.
- `disable_session_recording: true` and `capture_dead_clicks: false` disable those features explicitly, overriding remote/default settings.
- No code comments will be added.

## Files expected to touch
- `instrumentation-client.ts`
- `prompts/disable-posthog-lazy-extensions.md`

## Requirements
- Add these three options to the existing `posthog.init` config object:
  - `disable_session_recording: true`
  - `capture_dead_clicks: false`
  - `capture_performance: false`
- Preserve the existing key guard, `api_host`, `ui_host`, `defaults`, `capture_pageview`, and try/catch behavior.
- Do not add server-side PostHog code.
- Do not expose any new environment values to the browser.

## Security considerations
- PostHog project key remains public and server-host stays in env.
- No private keys or write tokens are involved.
- No secrets are logged.

## Acceptance criteria
- `instrumentation-client.ts` contains the three requested flags in `posthog.init`.
- No other files are modified for this change.
- The three named PostHog lazy extensions are disabled by explicit client config.

## Checks to run
- From `C:/Projects/vertex`: `npm run typecheck`
- From `C:/Projects/vertex`: `npm run lint`

## Manual test steps
- Run `npm run dev`.
- Open `http://localhost:3000`.
- Confirm the site loads normally.
- Confirm the three lazy-extension console errors no longer appear for Dead Clicks, Session Recording, and Web Vitals.
- Confirm ordinary page views and the implemented custom events still work.
