import {
  searchRequestSchema,
  searchStreamEventSchema,
  type SearchStreamEvent,
} from "@/lib/search/schema";
import { getSearchEnvironment } from "@/lib/search/context";
import { searchVertex } from "@/lib/search/search";

export const maxDuration = 60;

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function jsonError(message: string, status: number, retryable = false) {
  return Response.json(
    { error: message, retryable },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonError("Content-Type must be application/json.", 415);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = searchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Enter a search between 2 and 200 characters.", 400);
  }

  try {
    getSearchEnvironment();
  } catch {
    console.error("Search configuration validation failed");
    return jsonError("Search is temporarily unavailable.", 500);
  }

  const encoder = new TextEncoder();
  const streamAbortController = new AbortController();
  const signal = AbortSignal.any([
    request.signal,
    streamAbortController.signal,
  ]);
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: SearchStreamEvent) => {
        if (closed || signal.aborted) {
          return;
        }

        const validated = searchStreamEventSchema.parse(event);
        controller.enqueue(encoder.encode(`${JSON.stringify(validated)}\n`));
      };

      void (async () => {
        try {
          const data = await searchVertex(parsed.data.query, signal, (phase) => {
            send({ type: "status", phase });
          });

          send({ type: "results", data });
        } catch (error) {
          if (!signal.aborted) {
            console.error("Search request failed");
            const retryable =
              typeof error !== "object" ||
              error === null ||
              !("isRetryable" in error) ||
              error.isRetryable !== false;
            send({
              type: "error",
              message: retryable
                ? "Search could not be completed. Please try again."
                : "Search is unavailable right now.",
              retryable,
            });
          }
        } finally {
          if (!closed) {
            closed = true;
            controller.close();
          }
        }
      })();
    },
    cancel() {
      closed = true;
      streamAbortController.abort();
    },
  });

  return new Response(stream, { headers: RESPONSE_HEADERS });
}
