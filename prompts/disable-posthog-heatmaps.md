# Disable PostHog heatmap-driven dead clicks

## Goal
Stop the remaining `[PostHog.js] [Dead Clicks] "failed to load script"` console error by disabling heatmaps, which internally loads the dead-clicks extension even when `capture_dead_clicks` is false.

## Skills read
- No project skill applies.
- Inspected installed `posthog-js/dist/module.mjs` source for Dead Clicks and heatmaps behavior.

## Code inspected
- `instrumentation-client.ts`: current `posthog.init` already contains `disable_session_recording: true`, `capture_dead_clicks: false`, `capture_performance: false`.
- `.next/dev/static/chunks/instrumentation-client_ts_06kj-ail1b8l-._.js`: compiled dev chunk confirms those three flags are present.
- `node_modules/posthog-js/dist/module.mjs`: PostHog heatmaps class creates a dead-clicks loader with an always-true enabled check, so it can load `dead-clicks-autocapture.js` independently of `capture_dead_clicks`.
- `node_modules/@posthog/types/dist/posthog-config.d.ts`: `capture_heatmaps?: boolean | HeatmapConfig` overrides remote config when set.

## Decisions and assumptions
- Add `capture_heatmaps: false` to the same `posthog.init` config.
- Keep the three previously requested flags unchanged.
- Do not investigate network traces; do not change rewrites, env vars, components, or other files.
- No code comments will be added.

## Files expected to touch
- `instrumentation-client.ts`
- `prompts/disable-posthog-heatmaps.md`

## Requirements
- Add `capture_heatmaps: false` after `capture_performance: false` in `instrumentation-client.ts`.
- Preserve existing init guard, host settings, defaults, pageview setting, try/catch, and all three prior flags.
- Do not add server-side PostHog code or new env values.

## Security considerations
- PostHog project key stays public and env-backed.
- No private keys or tokens are involved.
- No secrets are logged.

## Acceptance criteria
- `capture_heatmaps: false` is present in `posthog.init`.
- Heatmap-driven dead-click loading is explicitly disabled.
- No other runtime files are changed for this fix.

## Checks to run
- From `C:/Projects/vertex`: `npm run typecheck`
- From `C:/Projects/vertex`: `npm run lint`

## Manual test steps
- Restart `npm run dev` if it was already running.
- Open `http://localhost:3000`.
- Confirm the `[Dead Clicks] "failed to load script"` console error no longer appears.
- Confirm normal page views and custom events still work.
