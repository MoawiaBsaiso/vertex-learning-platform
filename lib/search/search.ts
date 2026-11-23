import "server-only";

import { createGoogle, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import type { SanityImageSource } from "@sanity/image-url";
import { generateText, isStepCount, Output } from "ai";

import {
  normalizeSearchSelectors,
  searchPlanSchema,
  searchResponseSchema,
  type SearchPlan,
  type SearchResponse,
  type SearchSelector,
  type SearchStatusPhase,
  type VerifiedSearchResult,
} from "@/lib/search/schema";
import {
  connectToSearchContext,
  getSearchEnvironment,
} from "@/lib/search/context";
import {
  buildSearchInstructions,
  buildSearchPrompt,
} from "@/lib/search/prompt";
import {
  getKeywordSearchSelectors,
  getSearchHydration,
  type SearchHydration,
} from "@/sanity/lib/search";
import { urlFor } from "@/sanity/lib/image";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "about",
  "data",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "the",
  "to",
  "what",
  "with",
]);

type HydratedCourse = NonNullable<SearchHydration["courses"]>[number];
type HydratedLesson = NonNullable<SearchHydration["lessons"]>[number];
type HydratedVideo = NonNullable<SearchHydration["videos"]>[number];
type HydratedModule = NonNullable<HydratedCourse["modules"]>[number];

type GroundedCandidate = {
  result: VerifiedSearchResult;
  modelIndex: number;
};

export type SearchProgressCallback = (phase: SearchStatusPhase) => void;

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function stemToken(token: string) {
  if (token.length > 5 && token.endsWith("ing")) {
    return token.slice(0, -3);
  }

  if (token.length > 4 && token.endsWith("ed")) {
    return token.slice(0, -2);
  }

  if (token.length > 4 && token.endsWith("e")) {
    return token.slice(0, -1);
  }

  return token;
}

function getSearchTokens(query: string) {
  const tokens = unique(
    normalizeText(query)
      .split(" ")
      .filter(Boolean)
      .filter((token) => !STOP_WORDS.has(token))
      .map(stemToken)
      .filter(Boolean),
  );

  return tokens.length > 0 ? tokens : [normalizeText(query)].filter(Boolean);
}

async function getKeywordFallbackSelectors(query: string) {
  const terms = getSearchTokens(query).map((token) => `${token}*`);

  if (terms.length === 0) {
    return [];
  }

  const matches = await getKeywordSearchSelectors(terms);
  const selectors: SearchSelector[] = [];

  for (const match of matches) {
    if (!match.lessonId) {
      continue;
    }

    for (const placement of match.placements ?? []) {
      if (!placement?.courseId) {
        continue;
      }

      const courseModule = (placement.modules ?? []).find(
        (module) =>
          module?._key &&
          (module.lessonIds ?? []).includes(match.lessonId as string),
      );

      if (!courseModule?._key) {
        continue;
      }

      selectors.push({
        kind: "lesson",
        courseId: placement.courseId,
        moduleKey: courseModule._key,
        lessonId: match.lessonId,
      });
    }
  }

  return selectors;
}

function countTokenHits(value: string, tokens: string[]) {
  const normalized = normalizeText(value);
  return tokens.reduce(
    (count, token) => count + Number(normalized.includes(token)),
    0,
  );
}

function summarize(value: string | null | undefined, maxLength = 240) {
  const text = value
    ?.split(/\n+/)
    .map((part) => part.trim())
    .find(Boolean);

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildImageUrl(
  source: unknown,
  width: number,
  height: number,
) {
  if (!source) {
    return null;
  }

  try {
    return urlFor(source as SanityImageSource)
      .width(width)
      .height(height)
      .fit("crop")
      .auto("format")
      .url();
  } catch {
    return null;
  }
}

function resolveRelationship(
  selector: SearchSelector,
  course: HydratedCourse | undefined,
  lesson: HydratedLesson | undefined,
) {
  if (
    !course ||
    !lesson ||
    !course.title ||
    !course.slug ||
    !lesson.title ||
    !lesson.slug
  ) {
    return null;
  }

  const modules = (course.modules ?? []).filter(
    (module): module is HydratedModule => module !== null,
  );
  const moduleIndex = modules.findIndex(
    (module) =>
      module._key === selector.moduleKey &&
      (module.lessonIds ?? []).includes(selector.lessonId),
  );

  if (moduleIndex < 0) {
    return null;
  }

  const courseModule = modules[moduleIndex];
  const lessonIndex = (courseModule.lessonIds ?? []).indexOf(selector.lessonId);

  if (lessonIndex < 0 || !courseModule.title) {
    return null;
  }

  return {
    course,
    lesson,
    module: courseModule,
    moduleIndex,
    lessonIndex,
  };
}

function lessonEvidence(
  relationship: NonNullable<ReturnType<typeof resolveRelationship>>,
) {
  return [
    relationship.course.title,
    relationship.module.title,
    relationship.module.summary,
    relationship.lesson.title,
    ...(relationship.lesson.keyPoints ?? []),
    relationship.lesson.notesText,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function baseResult(
  relationship: NonNullable<ReturnType<typeof resolveRelationship>>,
) {
  const { course, lesson, module, moduleIndex, lessonIndex } = relationship;

  return {
    course: {
      id: course._id,
      title: course.title as string,
      slug: course.slug as string,
      iconUrl: buildImageUrl(course.icon, 80, 80),
    },
    module: {
      key: module._key,
      title: module.title as string,
      number: moduleIndex + 1,
    },
    lesson: {
      id: lesson._id,
      title: lesson.title as string,
      slug: lesson.slug as string,
      number: lessonIndex + 1,
      label: `${moduleIndex + 1}.${lessonIndex + 1}`,
    },
  };
}

function deriveClipLength(
  starts: Array<number | null>,
  startSeconds: number,
  duration: number,
) {
  const remaining = Math.floor(duration) - startSeconds;

  if (remaining <= 0) {
    return null;
  }

  const next = starts
    .filter((value): value is number => typeof value === "number")
    .sort((left, right) => left - right)
    .find((value) => value > startSeconds);
  const clipLength = next ? Math.min(next - startSeconds, remaining) : remaining;

  return clipLength > 0 ? clipLength : null;
}

function lessonCandidate(
  query: string,
  tokens: string[],
  selector: SearchSelector,
  relationship: NonNullable<ReturnType<typeof resolveRelationship>>,
  modelIndex: number,
): GroundedCandidate | null {
  if (selector.kind !== "lesson") {
    return null;
  }

  const evidence = lessonEvidence(relationship);
  const tokenHits = countTokenHits(evidence, tokens);

  if (tokenHits === 0) {
    return null;
  }

  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(relationship.lesson.title ?? "");
  const exactTitle =
    normalizedQuery.length > 0 && normalizedTitle.includes(normalizedQuery);
  const description =
    summarize(relationship.lesson.notesText) ||
    summarize(relationship.module.summary) ||
    summarize(relationship.course.summary) ||
    (relationship.lesson.title as string);
  const base = baseResult(relationship);

  return {
    modelIndex,
    result: {
      kind: "lesson",
      id: `lesson:${relationship.course._id}:${relationship.module._key}:${relationship.lesson._id}`,
      relevance: (exactTitle ? 4_000 : 2_000) + Math.min(tokenHits, 99),
      ...base,
      description,
      href: `/lessons/${encodeURIComponent(base.lesson.slug)}`,
      keyPoints: (relationship.lesson.keyPoints ?? []).filter(
        (point): point is string => typeof point === "string",
      ),
    },
  };
}

function videoCandidate(
  tokens: string[],
  selector: Extract<SearchSelector, { kind: "video" }>,
  relationship: NonNullable<ReturnType<typeof resolveRelationship>>,
  video: HydratedVideo | undefined,
  modelIndex: number,
): GroundedCandidate | null {
  if (
    !video ||
    video.url !== relationship.lesson.videoUrl ||
    typeof relationship.lesson.duration !== "number" ||
    selector.startSeconds >= relationship.lesson.duration
  ) {
    return null;
  }

  const chapters = (video.chapters ?? []).filter(
    (chapter): chapter is NonNullable<typeof chapter> => chapter !== null,
  );
  const chunks = (video.matchingChunks ?? []).filter(
    (chunk): chunk is NonNullable<typeof chunk> => chunk !== null,
  );
  const source =
    selector.matchSource === "chapter"
      ? chapters.find(
          (chapter) => chapter.startSeconds === selector.startSeconds,
        )
      : chunks.find((chunk) => chunk.startSeconds === selector.startSeconds);
  const sourceText =
    source && "label" in source ? source.label : source?.text;

  if (!sourceText) {
    return null;
  }

  const tokenHits = countTokenHits(sourceText, tokens);

  if (tokenHits === 0) {
    return null;
  }

  const starts =
    selector.matchSource === "chapter"
      ? chapters.map((chapter) => chapter.startSeconds)
      : (video.chunkStarts ?? []);
  const clipLengthSeconds = deriveClipLength(
    starts,
    selector.startSeconds,
    relationship.lesson.duration,
  );

  if (!clipLengthSeconds) {
    return null;
  }

  const base = baseResult(relationship);
  const transcriptDescription = summarize(sourceText);
  const lessonDescription = summarize(relationship.lesson.notesText);

  return {
    modelIndex,
    result: {
      kind: "video",
      id: `video:${relationship.lesson._id}:${video._id}:${selector.startSeconds}`,
      relevance:
        (selector.matchSource === "chapter" ? 3_000 : 1_000) +
        Math.min(tokenHits, 99),
      ...base,
      description:
        selector.matchSource === "transcript"
          ? transcriptDescription
          : lessonDescription || transcriptDescription,
      href: `/lessons/${encodeURIComponent(base.lesson.slug)}?start=${selector.startSeconds}`,
      thumbnailUrl: buildImageUrl(relationship.lesson.thumbnail, 720, 405),
      thumbnailAlt:
        relationship.lesson.thumbnail?.alt ||
        `${relationship.lesson.title} video thumbnail`,
      momentLabel:
        selector.matchSource === "chapter"
          ? sourceText
          : `Transcript match in ${relationship.lesson.title}`,
      startSeconds: selector.startSeconds,
      clipLengthSeconds,
      matchSource: selector.matchSource,
    },
  };
}

async function groundSearchPlan(
  query: string,
  selectors: SearchSelector[],
): Promise<SearchResponse> {
  if (selectors.length === 0) {
    return searchResponseSchema.parse({
      query,
      total: 0,
      courseCount: 0,
      videoResultCount: 0,
      lessonResultCount: 0,
      results: [],
    });
  }

  const hydration = await getSearchHydration({
    courseIds: unique(selectors.map((selector) => selector.courseId)),
    lessonIds: unique(selectors.map((selector) => selector.lessonId)),
    videoIds: unique(
      selectors.flatMap((selector) =>
        selector.kind === "video" ? [selector.videoId] : [],
      ),
    ),
    startSeconds: unique(
      selectors.flatMap((selector) =>
        selector.kind === "video" ? [selector.startSeconds] : [],
      ),
    ),
  });
  const courses = new Map(
    (hydration.courses ?? []).map((course) => [course._id, course]),
  );
  const lessons = new Map(
    (hydration.lessons ?? []).map((lesson) => [lesson._id, lesson]),
  );
  const videos = new Map(
    (hydration.videos ?? []).map((video) => [video._id, video]),
  );
  const tokens = getSearchTokens(query);
  const relationships = new Map<
    number,
    NonNullable<ReturnType<typeof resolveRelationship>>
  >();

  selectors.forEach((selector, index) => {
    const relationship = resolveRelationship(
      selector,
      courses.get(selector.courseId),
      lessons.get(selector.lessonId),
    );

    if (relationship) {
      relationships.set(index, relationship);
    }
  });

  const candidates: GroundedCandidate[] = [];
  const chapterVideos = new Set<string>();

  selectors.forEach((selector, index) => {
    const relationship = relationships.get(index);

    if (!relationship) {
      return;
    }

    if (selector.kind === "lesson") {
      const candidate = lessonCandidate(
        query,
        tokens,
        selector,
        relationship,
        index,
      );

      if (candidate) {
        candidates.push(candidate);
      }

      return;
    }

    if (selector.matchSource === "chapter") {
      const candidate = videoCandidate(
        tokens,
        selector,
        relationship,
        videos.get(selector.videoId),
        index,
      );

      if (candidate) {
        chapterVideos.add(selector.videoId);
        candidates.push(candidate);
      }
    }
  });

  selectors.forEach((selector, index) => {
    if (
      selector.kind !== "video" ||
      selector.matchSource !== "transcript" ||
      chapterVideos.has(selector.videoId)
    ) {
      return;
    }

    const relationship = relationships.get(index);

    if (!relationship) {
      return;
    }

    const candidate = videoCandidate(
      tokens,
      selector,
      relationship,
      videos.get(selector.videoId),
      index,
    );

    if (candidate) {
      candidates.push(candidate);
    }
  });

  const deduplicated = new Map<string, GroundedCandidate>();

  for (const candidate of candidates) {
    const existing = deduplicated.get(candidate.result.id);

    if (
      !existing ||
      candidate.result.relevance > existing.result.relevance ||
      (candidate.result.relevance === existing.result.relevance &&
        candidate.modelIndex < existing.modelIndex)
    ) {
      deduplicated.set(candidate.result.id, candidate);
    }
  }

  const results = [...deduplicated.values()]
    .sort(
      (left, right) =>
        right.result.relevance - left.result.relevance ||
        left.modelIndex - right.modelIndex ||
        left.result.id.localeCompare(right.result.id),
    )
    .map(({ result }) => result);
  const videoResultCount = results.filter(
    (result) => result.kind === "video",
  ).length;
  const lessonResultCount = results.length - videoResultCount;

  return searchResponseSchema.parse({
    query,
    total: results.length,
    courseCount: new Set(results.map((result) => result.course.id)).size,
    videoResultCount,
    lessonResultCount,
    results,
  });
}

export async function searchVertex(
  query: string,
  signal: AbortSignal,
  onProgress: SearchProgressCallback,
) {
  const environment = getSearchEnvironment();
  onProgress("connecting");
  let connection: Awaited<ReturnType<typeof connectToSearchContext>> | null =
    null;
  let groundingStarted = false;
  const startGrounding = () => {
    if (!groundingStarted) {
      groundingStarted = true;
      onProgress("grounding");
    }
  };

  try {
    try {
      connection = await connectToSearchContext(environment, signal);
      onProgress("searching");
      const google = createGoogle({ apiKey: environment.geminiApiKey });
      const result = await generateText({
        model: google(environment.geminiModel),
        instructions: buildSearchInstructions(connection.initialContext),
        prompt: buildSearchPrompt(query),
        tools: connection.tools,
        output: Output.object({
          name: "VertexSearchPlan",
          description:
            "Grounded selectors for relevant Vertex lessons and video moments.",
          schema: searchPlanSchema,
        }),
        stopWhen: isStepCount(4),
        prepareStep: ({ stepNumber }) =>
          stepNumber >= 2 ? { toolChoice: "none" } : undefined,
        abortSignal: signal,
        timeout: {
          totalMs: 15_000,
          stepMs: 10_000,
          toolMs: 8_000,
        },
        maxRetries: 0,
        providerOptions: {
          google: {
            structuredOutputs: true,
          } satisfies GoogleLanguageModelOptions,
        },
      });
      const plan: SearchPlan = result.output;

      startGrounding();
      const primaryResults = await groundSearchPlan(
        query,
        normalizeSearchSelectors(plan.matches),
      );

      if (primaryResults.total > 0) {
        return primaryResults;
      }
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      console.warn("Primary intelligent search unavailable; using keyword fallback");
    }

    startGrounding();
    return await groundSearchPlan(
      query,
      await getKeywordFallbackSelectors(query),
    );
  } finally {
    await connection?.client.close();
  }
}
