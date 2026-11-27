import "server-only";

import { createGoogle, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import type { SanityImageSource } from "@sanity/image-url";
import { generateText, isStepCount, Output } from "ai";

import {
  lessonSelectorSchema,
  normalizeSearchSelectors,
  SEARCH_RESULT_LIMIT,
  searchPlanSchema,
  searchResponseSchema,
  videoSelectorSchema,
  type SearchPlan,
  type SearchResponse,
  type SearchSelector,
  type SearchSource,
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
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you",
  "your",
]);

const MAX_MOMENTS_PER_VIDEO = 2;
const MIN_KEYWORD_LENGTH = 3;
const MIN_EDIT_TOLERANCE_LENGTH = 5;
const MAX_PHRASE_GAP = 2;

type HydratedCourse = NonNullable<SearchHydration["courses"]>[number];
type HydratedLesson = NonNullable<SearchHydration["lessons"]>[number];
type HydratedVideo = NonNullable<SearchHydration["videos"]>[number];
type HydratedModule = NonNullable<HydratedCourse["modules"]>[number];

type GroundedCandidate = {
  result: VerifiedSearchResult;
  modelIndex: number;
  videoId?: string | null;
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

function contentWords(value: string, stem: boolean) {
  const words = normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .filter(
      (word) => !STOP_WORDS.has(word) && word.length >= MIN_KEYWORD_LENGTH,
    );

  return stem ? words.map(stemToken).filter(Boolean) : words;
}

function getSearchTokens(query: string) {
  return unique(contentWords(query, true));
}

function withinOneEdit(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) {
    return false;
  }

  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }

    edits += 1;

    if (edits > 1) {
      return false;
    }

    if (left.length > right.length) {
      leftIndex += 1;
    } else if (left.length < right.length) {
      rightIndex += 1;
    } else {
      leftIndex += 1;
      rightIndex += 1;
    }
  }

  if (leftIndex < left.length || rightIndex < right.length) {
    edits += 1;
  }

  return edits <= 1;
}

function tokensMatch(left: string, right: string) {
  if (left === right) {
    return true;
  }

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;

  if (shorter.length >= MIN_KEYWORD_LENGTH && longer.startsWith(shorter)) {
    return true;
  }

  return (
    shorter.length >= MIN_EDIT_TOLERANCE_LENGTH &&
    longer.length >= MIN_EDIT_TOLERANCE_LENGTH &&
    withinOneEdit(shorter, longer)
  );
}

function hasPhraseSequence(haystack: string[], needles: string[]) {
  if (needles.length === 0) {
    return false;
  }

  for (let start = 0; start < haystack.length; start += 1) {
    let needleIndex = 0;
    let gaps = 0;

    for (
      let index = start;
      index < haystack.length && needleIndex < needles.length;
      index += 1
    ) {
      if (tokensMatch(haystack[index], needles[needleIndex])) {
        needleIndex += 1;
        gaps = 0;
        continue;
      }

      gaps += 1;

      if (gaps > MAX_PHRASE_GAP) {
        break;
      }
    }

    if (needleIndex === needles.length) {
      return true;
    }
  }

  return false;
}

function scoreTextMatch(value: string, query: string) {
  const normalizedValue = normalizeText(value);
  const normalizedQuery = normalizeText(query);
  const contentPhrase = contentWords(query, false).join(" ");
  const queryTokens = getSearchTokens(query);
  const valueTokens = contentWords(value, true);

  let score = 0;

  if (normalizedQuery && normalizedValue.includes(normalizedQuery)) {
    score += 1_600;
  }

  if (contentPhrase && normalizedValue.includes(contentPhrase)) {
    score += 1_000;
  }

  if (queryTokens.length > 1 && hasPhraseSequence(valueTokens, queryTokens)) {
    score += 600;
  }

  const matchedTokens = queryTokens.filter((token) =>
    valueTokens.some((valueToken) => tokensMatch(token, valueToken)),
  ).length;

  score += matchedTokens * 120;

  if (queryTokens.length > 1 && matchedTokens === queryTokens.length) {
    score += 200;
  }

  return { score, matchedTokens, tokenCount: queryTokens.length };
}

function hasRelevantMatch(match: ReturnType<typeof scoreTextMatch>) {
  if (match.tokenCount === 0) {
    return match.score > 0;
  }

  const requiredTokens =
    match.tokenCount > 3
      ? Math.max(2, Math.ceil(match.tokenCount * 0.7))
      : match.tokenCount;
  return match.matchedTokens >= requiredTokens || match.score >= 1_000;
}

type KeywordPlacement = {
  courseId?: string | null;
  lessonId?: string | null;
  modules?: Array<{
    _key?: string | null;
    lessonIds?: Array<string | null> | null;
  } | null> | null;
  placements?: Array<KeywordPlacement | null> | null;
};

type KeywordMatch = {
  kind?: string | null;
  lessonId?: string | null;
  videoId?: string | null;
  chapterStarts?: Array<number | null> | null;
  chunkStarts?: Array<number | null> | null;
  placements?: Array<KeywordPlacement | null> | null;
};

function selectorKey(selector: SearchSelector) {
  return JSON.stringify([
    selector.kind,
    selector.courseId,
    selector.moduleKey,
    selector.lessonId,
    selector.kind === "video" ? selector.videoId : null,
    selector.kind === "video" ? selector.startSeconds : null,
    selector.kind === "video" ? selector.matchSource : null,
  ]);
}

function findModuleKey(placement: KeywordPlacement, lessonId: string) {
  for (const courseModule of placement.modules ?? []) {
    if (
      courseModule?._key &&
      (courseModule.lessonIds ?? []).includes(lessonId)
    ) {
      return courseModule._key;
    }
  }

  return null;
}

function nonNegativeIntegerStarts(starts: Array<number | null> | null | undefined) {
  return (starts ?? []).filter(
    (start): start is number =>
      typeof start === "number" && Number.isInteger(start) && start >= 0,
  );
}

async function getKeywordFallbackSelectors(query: string) {
  const terms = getSearchTokens(query).map((token) => `${token}*`);

  if (terms.length === 0) {
    return [];
  }

  const matches = (await getKeywordSearchSelectors(terms)) as KeywordMatch[];
  const selectors: SearchSelector[] = [];
  const seen = new Set<string>();
  const addSelector = (candidate: SearchSelector) => {
    const parsed =
      candidate.kind === "lesson"
        ? lessonSelectorSchema.safeParse(candidate)
        : videoSelectorSchema.safeParse(candidate);

    if (!parsed.success) {
      return;
    }

    const selector = parsed.data;
    const key = selectorKey(selector);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    selectors.push(selector);
  };

  for (const match of matches) {
    if (!match?.placements) {
      continue;
    }

    if (match.kind === "lesson") {
      const lessonId = match.lessonId;

      if (!lessonId) {
        continue;
      }

      for (const placement of match.placements) {
        if (!placement?.courseId) {
          continue;
        }

        const moduleKey = findModuleKey(placement, lessonId);

        if (!moduleKey) {
          continue;
        }

        addSelector({
          kind: "lesson",
          courseId: placement.courseId,
          moduleKey,
          lessonId,
        });
      }

      continue;
    }

    if (match.kind !== "video" || !match.videoId) {
      continue;
    }

    const chapterStarts = nonNegativeIntegerStarts(match.chapterStarts);
    const chunkStarts = nonNegativeIntegerStarts(match.chunkStarts);

    if (chapterStarts.length === 0 && chunkStarts.length === 0) {
      continue;
    }

    for (const lessonPlacement of match.placements) {
      const lessonId = lessonPlacement?.lessonId;

      if (!lessonId) {
        continue;
      }

      for (const placement of lessonPlacement.placements ?? []) {
        if (!placement?.courseId) {
          continue;
        }

        const moduleKey = findModuleKey(placement, lessonId);

        if (!moduleKey) {
          continue;
        }

        for (const startSeconds of chapterStarts) {
          addSelector({
            kind: "video",
            courseId: placement.courseId,
            moduleKey,
            lessonId,
            videoId: match.videoId,
            startSeconds,
            matchSource: "chapter",
          });
        }

        for (const startSeconds of chunkStarts) {
          addSelector({
            kind: "video",
            courseId: placement.courseId,
            moduleKey,
            lessonId,
            videoId: match.videoId,
            startSeconds,
            matchSource: "transcript",
          });
        }
      }
    }
  }

  return selectors;
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
  selector: SearchSelector,
  relationship: NonNullable<ReturnType<typeof resolveRelationship>>,
  modelIndex: number,
): GroundedCandidate | null {
  if (selector.kind !== "lesson") {
    return null;
  }

  const evidence = lessonEvidence(relationship);
  const match = scoreTextMatch(evidence, query);

  if (!hasRelevantMatch(match)) {
    return null;
  }

  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(relationship.lesson.title ?? "");
  const exactTitle =
    normalizedQuery.length > 0 && normalizedTitle.includes(normalizedQuery);
  const titleMatch = scoreTextMatch(relationship.lesson.title ?? "", query);
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
      relevance:
        (exactTitle ? 4_200 : 1_800) +
        match.score +
        Math.round(titleMatch.score * 1.5),
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
  query: string,
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

  const match = scoreTextMatch(sourceText, query);

  if (!hasRelevantMatch(match)) {
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
    videoId: video._id,
    result: {
      kind: "video",
      id: `video:${relationship.lesson._id}:${video._id}:${selector.startSeconds}`,
      relevance:
        (selector.matchSource === "chapter" ? 3_200 : 900) + match.score,
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

function compareCandidates(
  left: GroundedCandidate,
  right: GroundedCandidate,
) {
  return (
    right.result.relevance - left.result.relevance ||
    left.modelIndex - right.modelIndex ||
    left.result.id.localeCompare(right.result.id)
  );
}

async function groundSearchPlan(
  query: string,
  selectors: SearchSelector[],
  searchSource: SearchSource,
): Promise<SearchResponse> {
  if (selectors.length === 0) {
    return searchResponseSchema.parse({
      query,
      total: 0,
      courseCount: 0,
      videoResultCount: 0,
      lessonResultCount: 0,
      searchSource,
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
      const candidate = lessonCandidate(query, selector, relationship, index);

      if (candidate) {
        candidates.push(candidate);
      }

      return;
    }

    if (selector.matchSource === "chapter") {
      const candidate = videoCandidate(
        query,
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
      query,
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

    if (!existing || compareCandidates(candidate, existing) < 0) {
      deduplicated.set(candidate.result.id, candidate);
    }
  }

  const ranked = [...deduplicated.values()].sort(compareCandidates);
  const momentCounts = new Map<string, number>();
  const selectedVideos: GroundedCandidate[] = [];
  const selectedLessons: GroundedCandidate[] = [];

  for (const candidate of ranked) {
    if (candidate.result.kind === "lesson") {
      selectedLessons.push(candidate);
      continue;
    }

    const key = candidate.videoId ?? candidate.result.id;
    const count = momentCounts.get(key) ?? 0;

    if (count >= MAX_MOMENTS_PER_VIDEO) {
      continue;
    }

    momentCounts.set(key, count + 1);
    selectedVideos.push(candidate);
  }

  const results = [...selectedVideos, ...selectedLessons]
    .sort(compareCandidates)
    .slice(0, SEARCH_RESULT_LIMIT)
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
    searchSource,
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
      const usedMcpTools =
        result.toolCalls.length > 0 ||
        result.staticToolCalls.length > 0 ||
        result.dynamicToolCalls.length > 0;

      if (!usedMcpTools) {
        throw new Error("Search planner did not query Sanity Context.");
      }

      const plan: SearchPlan = result.output;
      const primarySelectors = normalizeSearchSelectors(plan.matches);

      startGrounding();
      const primaryResults = await groundSearchPlan(
        query,
        primarySelectors,
        "mcp",
      );

      if (primaryResults.total > 0) {
        return primaryResults;
      }
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      console.warn(
        "Primary intelligent search unavailable; using keyword fallback",
      );
    }

    startGrounding();
    return await groundSearchPlan(
      query,
      await getKeywordFallbackSelectors(query),
      "fallback",
    );
  } finally {
    await connection?.client.close();
  }
}
