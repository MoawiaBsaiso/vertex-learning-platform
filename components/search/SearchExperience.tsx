"use client";

import posthog from "posthog-js";
import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import { SearchIcon } from "@/components/icons/VertexIcons";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchInput, SelectInput } from "@/components/ui/Input";
import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
  searchStreamEventSchema,
  type SearchResponse,
  type SearchSource,
  type SearchStatusPhase,
  type VerifiedSearchResult,
} from "@/lib/search/schema";

type SearchExperienceProps = {
  query: string;
};

type RequestState = {
  status: "idle" | "loading" | "success" | "error";
  phase: SearchStatusPhase | null;
  data: SearchResponse | null;
  error: string | null;
  retryable: boolean;
};

type RequestAction =
  | { type: "start" }
  | { type: "status"; phase: SearchStatusPhase }
  | { type: "success"; data: SearchResponse }
  | { type: "error"; message: string; retryable: boolean };

const INITIAL_STATE: RequestState = {
  status: "idle",
  phase: null,
  data: null,
  error: null,
  retryable: false,
};

const SORT_OPTIONS = [
  { label: "Most Relevant", value: "relevance" },
  { label: "Course A-Z", value: "course" },
  { label: "Result Type", value: "type" },
];

const PHASE_LABELS: Record<SearchStatusPhase, string> = {
  connecting: "Connecting to your learning library…",
  searching: "Searching lessons and video moments…",
  grounding: "Verifying every result…",
};

const SOURCE_LABELS: Record<SearchSource, string> = {
  mcp: "Gemini + Sanity MCP",
  fallback: "Keyword Fallback",
};

function requestReducer(
  state: RequestState,
  action: RequestAction,
): RequestState {
  switch (action.type) {
    case "start":
      return {
        status: "loading",
        phase: "connecting",
        data: null,
        error: null,
        retryable: false,
      };
    case "status":
      return { ...state, status: "loading", phase: action.phase };
    case "success":
      return {
        status: "success",
        phase: null,
        data: action.data,
        error: null,
        retryable: false,
      };
    case "error":
      return {
        status: "error",
        phase: null,
        data: null,
        error: action.message,
        retryable: action.retryable,
      };
  }
}

class SearchRequestError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "SearchRequestError";
    this.retryable = retryable;
  }
}

async function readErrorResponse(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: unknown;
      retryable?: unknown;
    };

    return {
      message:
        typeof payload.error === "string"
          ? payload.error
          : "Search could not be completed.",
      retryable: payload.retryable === true,
    };
  } catch {
    return { message: "Search could not be completed.", retryable: true };
  }
}

async function readSearchStream(
  response: Response,
  onStatus: (phase: SearchStatusPhase) => void,
) {
  if (!response.body) {
    throw new Error("Search returned no response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const resultHolder: { value: SearchResponse | null } = { value: null };

  const processLine = (line: string) => {
    if (!line.trim()) {
      return;
    }

    const parsed = searchStreamEventSchema.safeParse(JSON.parse(line));

    if (!parsed.success) {
      throw new Error("Search returned an invalid response.");
    }

    if (parsed.data.type === "status") {
      onStatus(parsed.data.phase);
    } else if (parsed.data.type === "results") {
      resultHolder.value = parsed.data.data;
    } else {
      throw new SearchRequestError(
        parsed.data.message,
        parsed.data.retryable,
      );
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      processLine(line);
    }

    if (done) {
      break;
    }
  }

  if (buffer.trim()) {
    processLine(buffer);
  }

  if (!resultHolder.value) {
    throw new Error("Search ended before results were ready.");
  }

  return resultHolder.value;
}

function sortResults(
  results: VerifiedSearchResult[],
  sort: "relevance" | "course" | "type",
) {
  const sorted = [...results];

  if (sort === "course") {
    sorted.sort(
      (left, right) =>
        left.course.title.localeCompare(right.course.title) ||
        right.relevance - left.relevance,
    );
  } else if (sort === "type") {
    sorted.sort(
      (left, right) =>
        left.kind.localeCompare(right.kind) ||
        right.relevance - left.relevance,
    );
  }

  return sorted;
}

function SearchSkeleton({ phase }: { phase: SearchStatusPhase | null }) {
  return (
    <div className="mt-8" aria-busy="true">
      <p className="text-[14px] text-[#596171]" role="status" aria-live="polite">
        {phase ? PHASE_LABELS[phase] : "Preparing search…"}
      </p>
      <div className="mt-5 space-y-4" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-[220px] animate-pulse rounded-xl border border-[#EDE2DC] bg-white/70"
          />
        ))}
      </div>
    </div>
  );
}

export function SearchExperience({ query }: SearchExperienceProps) {
  const [state, dispatch] = useReducer(requestReducer, INITIAL_STATE);
  const [sort, setSort] = useState<"relevance" | "course" | "type">(
    "relevance",
  );
  const [retryKey, setRetryKey] = useState(0);
  const queryIsValid =
    query.length >= SEARCH_QUERY_MIN_LENGTH &&
    query.length <= SEARCH_QUERY_MAX_LENGTH;

  useEffect(() => {
    if (!queryIsValid) {
      return;
    }

    const controller = new AbortController();
    const startedAt = performance.now();
    dispatch({ type: "start" });

    void (async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const failure = await readErrorResponse(response);
          throw new SearchRequestError(failure.message, failure.retryable);
        }

        const data = await readSearchStream(response, (phase) => {
          dispatch({ type: "status", phase });
        });

        if (controller.signal.aborted) {
          return;
        }

        dispatch({ type: "success", data });
        posthog.capture("search_performed", {
          query_length: query.length,
          result_count: data.total,
          course_count: data.courseCount,
          video_result_count: data.videoResultCount,
          lesson_result_count: data.lessonResultCount,
          duration_ms: Math.round(performance.now() - startedAt),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        dispatch({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Search could not be completed.",
          retryable:
            error instanceof SearchRequestError ? error.retryable : true,
        });
      }
    })();

    return () => controller.abort();
  }, [query, queryIsValid, retryKey]);

  const sortedResults = state.data
    ? sortResults(state.data.results, sort)
    : [];

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 pb-20 pt-10 sm:px-10 sm:pt-14">
      <div className="max-w-[700px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-600">
          Intelligent search
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.08] tracking-[-0.035em] text-[#111111]">
          Find the exact lesson.
        </h1>
        <p className="mt-4 max-w-[620px] text-[16px] leading-7 text-[#596171]">
          Search course topics in plain English and jump straight to the lesson
          or verified moment where it is taught.
        </p>
      </div>

      <form
        action="/search"
        method="get"
        role="search"
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="results-search" className="sr-only">
          Search courses and lessons
        </label>
        <SearchInput
          key={query}
          id="results-search"
          name="q"
          defaultValue={query}
          required
          minLength={SEARCH_QUERY_MIN_LENGTH}
          maxLength={SEARCH_QUERY_MAX_LENGTH}
          placeholder="What do you want to learn?"
          containerClassName="h-[52px] flex-1 border-[#E3D7D0] shadow-sm"
        />
        <button
          type="submit"
          className="inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md bg-primary-500 px-6 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(234,88,12,0.2)] transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          <SearchIcon size={18} />
          Search
        </button>
      </form>

      {!query ? (
        <div className="mt-12 rounded-xl border border-dashed border-[#DFD1C8] bg-white/55 px-6 py-12 text-center">
          <p className="font-display text-[24px] text-[#111111]">
            Ask about any topic in your courses.
          </p>
          <p className="mx-auto mt-2 max-w-[480px] text-[14px] leading-6 text-[#596171]">
            Try “context windows”, “Kubernetes ingress”, or “accessible forms”.
          </p>
        </div>
      ) : !queryIsValid ? (
        <p className="mt-8 rounded-md border border-[#F0D7CB] bg-[#FFF7F2] px-4 py-3 text-[14px] text-[#8B3F20]">
          Enter a search between {SEARCH_QUERY_MIN_LENGTH} and{" "}
          {SEARCH_QUERY_MAX_LENGTH} characters.
        </p>
      ) : state.status === "loading" ? (
        <SearchSkeleton phase={state.phase} />
      ) : state.status === "error" ? (
        <div className="mt-10 rounded-xl border border-[#EADDD6] bg-white px-6 py-10 text-center">
          <h2 className="font-display text-[25px] text-[#111111]">
            Search is taking a break.
          </h2>
          <p className="mt-2 text-[14px] text-[#596171]">{state.error}</p>
          {state.retryable ? (
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="mt-5 inline-flex cursor-pointer items-center rounded-md bg-primary-500 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : state.data ? (
        <section className="mt-10" aria-labelledby="search-results-heading">
          <div className="flex flex-col gap-4 border-b border-[#EADFD8] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="search-results-heading"
                className="font-display text-[27px] tracking-[-0.02em] text-[#111111]"
              >
                {state.data.total === 0
                  ? "No matching lessons"
                  : `Found ${state.data.total} ${state.data.total === 1 ? "result" : "results"}`}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                {state.data.total > 0 ? (
                  <p className="text-[13px] text-[#596171]">
                    Across {state.data.courseCount}{" "}
                    {state.data.courseCount === 1 ? "course" : "courses"}
                  </p>
                ) : null}
                <span
                  className={`inline-flex items-center rounded-[6px] border px-2.5 py-1 font-sans text-[11px] font-semibold normal-case tracking-[0.02em] ${
                    state.data.searchSource === "mcp"
                      ? "border-transparent bg-primary-100 text-primary-500"
                      : "border-neutral-200 bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {SOURCE_LABELS[state.data.searchSource]}
                </span>
              </div>
            </div>

            {state.data.total > 1 ? (
              <div className="w-full sm:w-[180px]">
                <label htmlFor="result-sort" className="sr-only">
                  Sort search results
                </label>
                <SelectInput
                  id="result-sort"
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target.value as "relevance" | "course" | "type",
                    )
                  }
                  options={SORT_OPTIONS}
                />
              </div>
            ) : null}
          </div>

          {sortedResults.length > 0 ? (
            <div className="mt-6 space-y-5">
              {sortedResults.map((result, index) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  rank={index}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-b-xl border-x border-b border-[#EADFD8] bg-white/60 px-6 py-12 text-center">
              <p className="text-[14px] leading-6 text-[#596171]">
                We could not find a grounded match for “{query}”. Try a broader
                topic or browse every course.
              </p>
              <Link
                href="/courses"
                className="mt-5 inline-flex rounded-sm text-[14px] font-semibold text-primary-600 transition-colors hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
              >
                Browse all courses
              </Link>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
