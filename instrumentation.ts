import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

const loggerProvider =
  token && host
    ? new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "vertex-learning-platform" }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: new URL("/i/v1/logs", host).toString(),
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : undefined;

export const posthogLogger = loggerProvider?.getLogger("vertex.posthog");

export function register() {
  if (!loggerProvider) {
    if (process.env.NODE_ENV !== "production") {
      const missingVariable = token
        ? "NEXT_PUBLIC_POSTHOG_HOST"
        : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

      console.warn(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
      );
    }
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.once("beforeExit", () => {
      void loggerProvider.forceFlush().catch(() => {});
    });
  }
}
