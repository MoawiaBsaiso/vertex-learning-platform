"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";

export interface CourseViewedProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
}

export function CourseViewed({
  courseId,
  courseSlug,
  courseTitle,
}: CourseViewedProps) {
  const captured = useRef(false);

  useEffect(() => {
    if (captured.current) {
      return;
    }

    captured.current = true;
    posthog.capture("course_viewed", {
      course_id: courseId,
      course_slug: courseSlug,
      course_title: courseTitle,
    });
  }, [courseId, courseSlug, courseTitle]);

  return null;
}
