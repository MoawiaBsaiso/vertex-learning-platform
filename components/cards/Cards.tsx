import React from "react";
import Link from "next/link";
import {
  BarChartIcon,
  ClockIcon,
  DocumentIcon,
  ExternalLinkIcon,
  FolderIcon,
  PlayCircleIcon,
} from "@/components/icons/VertexIcons";
import { Badge } from "@/components/ui/Badge";

export interface CourseCardProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  description: string;
  level: string;
  duration: string;
  moduleCount: string;
  href?: string;
  className?: string;
}

export function CourseCard({
  badgeText = "N",
  badgeIcon,
  title,
  description,
  level,
  duration,
  moduleCount,
  href,
  className = "",
}: CourseCardProps) {
  const content = (
    <article
      className={`flex h-full flex-col justify-between rounded-md border border-neutral-200 bg-white p-5 transition-shadow duration-150 hover:shadow-md ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-neutral-900 text-[16px] font-semibold text-white">
          {badgeIcon ?? badgeText}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-5 text-neutral-900">
            {title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-[19px] text-neutral-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <BarChartIcon size={14} className="text-neutral-500" />
          <span>{level}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon size={14} className="text-neutral-500" />
          <span>{duration}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FolderIcon size={14} className="text-neutral-500" />
          <span>{moduleCount}</span>
        </span>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md">
        {content}
      </Link>
    );
  }
  return content;
}

export interface LessonVideoCardProps {
  title: string;
  description: string;
  lessonMeta: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
  className?: string;
}

export function LessonVideoCard({
  title,
  description,
  lessonMeta,
  actionLabel,
  href,
  onAction,
  className = "",
}: LessonVideoCardProps) {
  const actionElement = href ? (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-500 transition-colors hover:text-[#DC570A]"
    >
      <PlayCircleIcon size={15} className="text-primary-500" />
      <span>{actionLabel}</span>
    </Link>
  ) : (
    <button
      type="button"
      onClick={onAction}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-500 transition-colors hover:text-[#DC570A] cursor-pointer"
    >
      <PlayCircleIcon size={15} className="text-primary-500" />
      <span>{actionLabel}</span>
    </button>
  );

  return (
    <article
      className={`flex h-full flex-col justify-between rounded-md border border-neutral-200 bg-white p-5 transition-shadow duration-150 hover:shadow-md ${className}`}
    >
      <div>
        <Badge variant="video" />
        <h3 className="mt-3 text-[15px] font-semibold leading-5 text-neutral-900">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-[19px] text-neutral-500">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 pt-1">
        <span className="text-[12px] text-neutral-500">{lessonMeta}</span>
        {actionElement}
      </div>
    </article>
  );
}

export interface LessonTopicCardProps {
  title: string;
  description: string;
  moduleMeta: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
  className?: string;
}

export function LessonTopicCard({
  title,
  description,
  moduleMeta,
  actionLabel = "View lesson",
  href,
  onAction,
  className = "",
}: LessonTopicCardProps) {
  const actionElement = href ? (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-500 transition-colors hover:text-[#DC570A]"
    >
      <span>{actionLabel}</span>
      <ExternalLinkIcon size={13} />
    </Link>
  ) : (
    <button
      type="button"
      onClick={onAction}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-500 transition-colors hover:text-[#DC570A] cursor-pointer"
    >
      <span>{actionLabel}</span>
      <ExternalLinkIcon size={13} />
    </button>
  );

  return (
    <article
      className={`flex h-full flex-col justify-between rounded-md border border-neutral-200 bg-white p-5 transition-shadow duration-150 hover:shadow-md ${className}`}
    >
      <div>
        <Badge variant="lesson" />
        <h3 className="mt-3 text-[15px] font-semibold leading-5 text-neutral-900">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-[19px] text-neutral-500">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 pt-1">
        <span className="text-[12px] text-neutral-500">{moduleMeta}</span>
        {actionElement}
      </div>
    </article>
  );
}

export interface ResourceCardProps {
  title: string;
  description: string;
  fileMeta: string;
  href?: string;
  onAction?: () => void;
  className?: string;
}

export function ResourceCard({
  title,
  description,
  fileMeta,
  href,
  onAction,
  className = "",
}: ResourceCardProps) {
  const actionElement = href ? (
    <Link
      href={href}
      aria-label={`Open ${title}`}
      className="inline-flex items-center text-primary-500 transition-colors hover:text-[#DC570A]"
    >
      <ExternalLinkIcon size={15} />
    </Link>
  ) : (
    <button
      type="button"
      onClick={onAction}
      aria-label={`Open ${title}`}
      className="inline-flex items-center text-primary-500 transition-colors hover:text-[#DC570A] cursor-pointer"
    >
      <ExternalLinkIcon size={15} />
    </button>
  );

  return (
    <article
      className={`flex h-full flex-col justify-between rounded-md border border-neutral-200 bg-white p-5 transition-shadow duration-150 hover:shadow-md ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-neutral-100 text-neutral-700">
          <DocumentIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-5 text-neutral-900">
            {title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-[19px] text-neutral-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <span className="text-[12px] text-neutral-500">{fileMeta}</span>
        {actionElement}
      </div>
    </article>
  );
}
