"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

import {
  ClockIcon,
  ExternalLinkIcon,
  PlayCircleIcon,
} from "@/components/icons/VertexIcons";
import { Badge } from "@/components/ui/Badge";
import type { VerifiedSearchResult } from "@/lib/search/schema";

type SearchResultCardProps = {
  result: VerifiedSearchResult;
  rank: number;
};

function formatTimestamp(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatClipLength(totalSeconds: number) {
  const seconds = Math.max(1, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) {
    return `${remainder}s clip`;
  }

  return remainder > 0 ? `${minutes}m ${remainder}s clip` : `${minutes}m clip`;
}

function CourseMark({ result }: { result: VerifiedSearchResult }) {
  if (result.course.iconUrl) {
    return (
      <Image
        src={result.course.iconUrl}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-sm object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-900 font-display text-[18px] text-white"
    >
      {result.course.title.charAt(0).toUpperCase()}
    </span>
  );
}

function captureResultClick(result: VerifiedSearchResult, rank: number) {
  posthog.capture("search_result_clicked", {
    result_kind: result.kind,
    result_rank: rank,
    lesson_id: result.lesson.id,
    course_id: result.course.id,
  });
}

export function captureSearchResultOpened(result: VerifiedSearchResult, rank: number) {
  posthog.capture("search_result_opened", {
    result_kind: result.kind,
    result_rank: rank,
    lesson_id: result.lesson.id,
    course_id: result.course.id,
  });
}

export function SearchResultCard({ result, rank }: SearchResultCardProps) {
  const lessonMeta = `Lesson ${result.lesson.label} in ${result.module.title}`;

  if (result.kind === "video") {
    return (
      <article className="overflow-hidden rounded-xl border border-[#E9DDD6] bg-white shadow-[0_12px_32px_rgba(94,55,35,0.045)] transition-shadow hover:shadow-[0_18px_38px_rgba(94,55,35,0.08)]">
        <div className="grid md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="relative aspect-video overflow-hidden bg-neutral-900 md:aspect-auto md:min-h-[230px]">
            {result.thumbnailUrl ? (
              <Image
                src={result.thumbnailUrl}
                alt={result.thumbnailAlt}
                fill
                sizes="(min-width: 768px) 240px, 100vw"
                className="object-cover opacity-90"
              />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/75 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm">
              <PlayCircleIcon size={16} />
              {formatTimestamp(result.startSeconds)}
            </span>
          </div>

          <div className="flex min-w-0 flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Badge variant="video" />
              <span className="text-[12px] text-neutral-500">
                {formatClipLength(result.clipLengthSeconds)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <CourseMark result={result} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-neutral-900">
                  {result.course.title}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                  {lessonMeta}
                </p>
              </div>
            </div>

            <h2 className="mt-5 font-display text-[24px] leading-[1.2] tracking-[-0.02em] text-[#111111]">
              {result.momentLabel}
            </h2>
            <p className="mt-2.5 line-clamp-3 text-[14px] leading-6 text-[#596171]">
              {result.description}
            </p>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              <span className="inline-flex items-center gap-2 text-[12px] text-neutral-500">
                <ClockIcon size={15} />
                Starts at {formatTimestamp(result.startSeconds)}
              </span>
              <Link
                href={result.href}
                onClick={() => {
                  captureResultClick(result, rank);
                  captureSearchResultOpened(result, rank);
                }}
                className="inline-flex items-center gap-2 rounded-sm bg-primary-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
              >
                <PlayCircleIcon size={16} />
                Watch from {formatTimestamp(result.startSeconds)}
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-[#E9DDD6] bg-white p-5 shadow-[0_12px_32px_rgba(94,55,35,0.04)] transition-shadow hover:shadow-[0_18px_38px_rgba(94,55,35,0.075)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Badge variant="lesson" />
        <span className="text-[12px] text-neutral-500">{lessonMeta}</span>
      </div>

      <div className="mt-5 flex items-start gap-4">
        <CourseMark result={result} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-700">
            {result.course.title}
          </p>
          <h2 className="mt-1 font-display text-[26px] leading-[1.18] tracking-[-0.025em] text-[#111111]">
            {result.lesson.title}
          </h2>
        </div>
      </div>

      <p className="mt-4 max-w-[760px] text-[14px] leading-6 text-[#596171]">
        {result.description}
      </p>

      {result.keyPoints.length > 0 ? (
        <ul className="mt-5 grid gap-2 border-t border-[#F0E7E2] pt-4 text-[13px] leading-5 text-neutral-700 sm:grid-cols-2">
          {result.keyPoints.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Link
          href={result.href}
          onClick={() => {
            captureResultClick(result, rank);
            captureSearchResultOpened(result, rank);
          }}
          className="inline-flex items-center gap-2 rounded-sm text-[13px] font-semibold text-primary-600 transition-colors hover:text-[#C84B0B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
        >
          View lesson
          <ExternalLinkIcon size={14} />
        </Link>
      </div>
    </article>
  );
}
