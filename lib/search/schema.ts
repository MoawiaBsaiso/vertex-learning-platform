import { z } from "zod";

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 200;

export const searchRequestSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(SEARCH_QUERY_MIN_LENGTH)
      .max(SEARCH_QUERY_MAX_LENGTH),
  })
  .strict();

const contentIdSchema = z.string().min(1).max(256);

export const lessonSelectorSchema = z
  .object({
    kind: z.literal("lesson"),
    courseId: contentIdSchema,
    moduleKey: contentIdSchema,
    lessonId: contentIdSchema,
  })
  .strict();

export const videoSelectorSchema = z
  .object({
    kind: z.literal("video"),
    courseId: contentIdSchema,
    moduleKey: contentIdSchema,
    lessonId: contentIdSchema,
    videoId: contentIdSchema,
    startSeconds: z.number().int().min(0),
    matchSource: z.enum(["chapter", "transcript"]),
  })
  .strict();

const modelSearchSelectorSchema = z
  .object({
    kind: z.enum(["lesson", "video"]),
    courseId: contentIdSchema,
    moduleKey: contentIdSchema,
    lessonId: contentIdSchema,
    videoId: contentIdSchema
      .nullable()
      .describe("Video document ID for video matches; null for lesson matches."),
    startSeconds: z
      .number()
      .int()
      .min(0)
      .nullable()
      .describe("Exact stored start second for video matches; null for lessons."),
    matchSource: z
      .enum(["chapter", "transcript"])
      .nullable()
      .describe("Timestamp evidence source for video matches; null for lessons."),
  })
  .strict();

export const searchPlanSchema = z
  .object({
    matches: z.array(modelSearchSelectorSchema),
  })
  .strict();

const courseResultSchema = z
  .object({
    id: contentIdSchema,
    title: z.string(),
    slug: z.string(),
    iconUrl: z.string().nullable(),
  })
  .strict();

const moduleResultSchema = z
  .object({
    key: contentIdSchema,
    title: z.string(),
    number: z.number().int().positive(),
  })
  .strict();

const lessonResultContextSchema = z
  .object({
    id: contentIdSchema,
    title: z.string(),
    slug: z.string(),
    number: z.number().int().positive(),
    label: z.string(),
  })
  .strict();

const searchResultBaseSchema = z.object({
  id: z.string(),
  relevance: z.number().int().nonnegative(),
  course: courseResultSchema,
  module: moduleResultSchema,
  lesson: lessonResultContextSchema,
  description: z.string(),
  href: z.string(),
});

export const verifiedLessonResultSchema = searchResultBaseSchema
  .extend({
    kind: z.literal("lesson"),
    keyPoints: z.array(z.string()),
  })
  .strict();

export const verifiedVideoResultSchema = searchResultBaseSchema
  .extend({
    kind: z.literal("video"),
    thumbnailUrl: z.string().nullable(),
    thumbnailAlt: z.string(),
    momentLabel: z.string(),
    startSeconds: z.number().int().min(0),
    clipLengthSeconds: z.number().int().positive(),
    matchSource: z.enum(["chapter", "transcript"]),
  })
  .strict();

export const verifiedSearchResultSchema = z.discriminatedUnion("kind", [
  verifiedLessonResultSchema,
  verifiedVideoResultSchema,
]);

export const searchResponseSchema = z
  .object({
    query: z.string(),
    total: z.number().int().nonnegative(),
    courseCount: z.number().int().nonnegative(),
    videoResultCount: z.number().int().nonnegative(),
    lessonResultCount: z.number().int().nonnegative(),
    results: z.array(verifiedSearchResultSchema),
  })
  .strict();

export const searchStatusEventSchema = z
  .object({
    type: z.literal("status"),
    phase: z.enum(["connecting", "searching", "grounding"]),
  })
  .strict();

export const searchResultsEventSchema = z
  .object({
    type: z.literal("results"),
    data: searchResponseSchema,
  })
  .strict();

export const searchErrorEventSchema = z
  .object({
    type: z.literal("error"),
    message: z.string(),
    retryable: z.boolean(),
  })
  .strict();

export const searchStreamEventSchema = z.discriminatedUnion("type", [
  searchStatusEventSchema,
  searchResultsEventSchema,
  searchErrorEventSchema,
]);

export type SearchPlan = z.infer<typeof searchPlanSchema>;
export type SearchSelector =
  | z.infer<typeof lessonSelectorSchema>
  | z.infer<typeof videoSelectorSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type VerifiedSearchResult = z.infer<typeof verifiedSearchResultSchema>;
export type VerifiedLessonResult = z.infer<typeof verifiedLessonResultSchema>;
export type VerifiedVideoResult = z.infer<typeof verifiedVideoResultSchema>;
export type SearchStatusPhase = z.infer<
  typeof searchStatusEventSchema
>["phase"];
export type SearchStreamEvent = z.infer<typeof searchStreamEventSchema>;

export function normalizeSearchSelectors(
  matches: SearchPlan["matches"],
): SearchSelector[] {
  const selectors: SearchSelector[] = [];

  for (const match of matches) {
    if (match.kind === "lesson") {
      const parsed = lessonSelectorSchema.safeParse({
        kind: "lesson",
        courseId: match.courseId,
        moduleKey: match.moduleKey,
        lessonId: match.lessonId,
      });

      if (parsed.success) {
        selectors.push(parsed.data);
      }

      continue;
    }

    const parsed = videoSelectorSchema.safeParse({
      kind: "video",
      courseId: match.courseId,
      moduleKey: match.moduleKey,
      lessonId: match.lessonId,
      videoId: match.videoId,
      startSeconds: match.startSeconds,
      matchSource: match.matchSource,
    });

    if (parsed.success) {
      selectors.push(parsed.data);
    }
  }

  return selectors;
}
