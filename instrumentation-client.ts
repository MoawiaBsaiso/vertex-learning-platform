import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const posthogUiHost =
  posthogHost?.includes("eu.") ? posthogHost : "https://eu.posthog.com";

try {
  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: "/ingest",
      ui_host: posthogUiHost,
      defaults: "2026-01-30",
      capture_pageview: "history_change",
      disable_session_recording: true,
      capture_dead_clicks: false,
      capture_performance: false,
      capture_heatmaps: false,
    });
  }
} catch (error) {
  console.warn("[posthog] failed to initialize", error);
}
