"use client";

import posthog from "posthog-js";
import { useState } from "react";

import { BookmarkIcon } from "@/components/icons/VertexIcons";

export interface BookmarkButtonProps {
  className?: string;
  courseSlug?: string;
  courseTitle?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
}

export function BookmarkButton({
  className = "",
  courseSlug,
  courseTitle,
  iconOnly = false,
  ariaLabel = "Bookmark this course",
}: BookmarkButtonProps) {
  const [pressed, setPressed] = useState(false);

  function handleClick() {
    const next = !pressed;

    setPressed(next);

    if (next) {
      posthog.capture("course_bookmarked", {
        course_slug: courseSlug,
        course_title: courseTitle,
      });
    }
  }

  const modeClasses = iconOnly
    ? "h-[44px] w-[44px] gap-0 rounded-lg border border-[#E5DBD4] bg-white text-primary-500 hover:bg-[#FFF8F4]"
    : "h-[48px] gap-2 rounded-md border border-[#E5DBD4] bg-white px-6 font-display text-[16px] text-[#111111] hover:bg-[#FFF8F4]";

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={`inline-flex cursor-pointer items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${modeClasses} ${className}`}
    >
      <BookmarkIcon
        variant={pressed ? "filled" : "outline"}
        size={iconOnly ? 20 : 18}
      />
      {!iconOnly && "Bookmark"}
    </button>
  );
}
