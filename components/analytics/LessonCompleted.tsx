"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";

export interface LessonCompletedProps {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  courseId: string;
  courseSlug: string;
}

export function LessonCompleted({
  lessonId,
  lessonSlug,
  lessonTitle,
  courseId,
  courseSlug,
}: LessonCompletedProps) {
  const captured = useRef(false);

  useEffect(() => {
    if (captured.current) {
      return;
    }

    captured.current = true;
    posthog.capture("lesson_completed", {
      lesson_id: lessonId,
      lesson_slug: lessonSlug,
      lesson_title: lessonTitle,
      course_id: courseId,
      course_slug: courseSlug,
    });
  }, [lessonId, lessonSlug, lessonTitle, courseId, courseSlug]);

  return null;
}