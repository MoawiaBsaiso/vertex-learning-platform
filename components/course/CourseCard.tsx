"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

import {
  BarChartIcon,
  ClockIcon,
  DocumentIcon,
} from "@/components/icons/VertexIcons";
import type { getCourses } from "@/sanity/lib/data";
import { urlFor } from "@/sanity/lib/image";

type Course = Awaited<ReturnType<typeof getCourses>>[number];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug ?? ""}`}
      onClick={() =>
        posthog.capture("course_opened", {
          course_id: course._id,
          course_slug: course.slug ?? "unknown",
          course_level: course.level ?? "unspecified",
          module_count: course.moduleCount,
        })
      }
      className="vertexCourseCard flex min-h-[374px] flex-col rounded-lg border border-[#E9DBD3] bg-white/55 px-[26px] pb-[27px] pt-[31px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
    >
      {course.coverImage && (
        <Image
          src={urlFor(course.coverImage).size(148, 148).fit("crop").url()}
          alt=""
          width={74}
          height={74}
          className="h-[74px] w-[74px] rounded-[10px] object-cover"
        />
      )}
      <h3 className="mt-[27px] font-display text-[22px] leading-[30px] tracking-[-0.025em] text-[#121212]">
        {course.title}
      </h3>
      <p className="mt-[13px] text-[14px] leading-[25px] text-[#5D6574]">
        {course.summary}
      </p>

      <div className="-mx-[9px] mt-auto flex items-center justify-between gap-2 border-t border-[#E9DBD3] px-[9px] pt-[20px] text-[10px] text-[#4F5868]">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <BarChartIcon size={16} className="shrink-0" />
          {course.level ? capitalize(course.level) : null}
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <ClockIcon size={16} className="shrink-0" />
          {course.durationLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <DocumentIcon size={16} className="shrink-0" />
          {course.moduleCount} module{course.moduleCount === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}
