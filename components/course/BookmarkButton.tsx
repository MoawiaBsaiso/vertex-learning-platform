"use client";

import { useState } from "react";
import posthog from "posthog-js";

import { BookmarkIcon } from "@/components/icons/VertexIcons";

export interface BookmarkButtonProps {
  courseId: string;
  courseSlug: string;
  className?: string;
}

export function BookmarkButton({
  courseId,
  courseSlug,
  className = "",
}: BookmarkButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    const isBookmarked = !pressed;

    setPressed(isBookmarked);
    posthog.capture("course_bookmark_changed", {
      course_id: courseId,
      course_slug: courseSlug,
      is_bookmarked: isBookmarked,
    });
  };

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label="Bookmark this course"
      onClick={handleClick}
      className={`inline-flex h-[48px] cursor-pointer items-center justify-center gap-2 rounded-md border border-[#E5DBD4] bg-white px-6 font-display text-[16px] text-[#111111] transition-colors hover:bg-[#FFF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${className}`}
    >
      <BookmarkIcon variant={pressed ? "filled" : "outline"} size={18} />
      Bookmark
    </button>
  );
}
