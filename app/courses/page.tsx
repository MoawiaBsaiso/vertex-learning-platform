import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CourseCard } from "@/components/course/CourseCard";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getCourses } from "@/sanity/lib/data";

export const metadata: Metadata = {
  title: "All Courses | Vertex",
  description:
    "Browse every Vertex course and find the one that fits what you want to learn.",
};

async function CoursesPageContent() {
  const allCourses = await getCourses();
  const courses = [...allCourses].sort(
    (a, b) =>
      Number(b.popular ?? false) - Number(a.popular ?? false) ||
      (a.title ?? "").localeCompare(b.title ?? ""),
  );

  return (
    <div className="min-h-screen bg-[#fffaf7]">
      <SiteHeader coursesHref="/courses" coursesActive font="serif" />

      <main className="mx-auto w-full max-w-[1024px] px-5 pb-20 pt-12 sm:px-[52px]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="font-display text-[32px] leading-tight tracking-[-0.025em] text-[#111111] sm:text-[38px]">
            All Courses
          </h1>
          <p className="text-[14px] text-[#5D6574]">
            {courses.length} course{courses.length === 1 ? "" : "s"}
          </p>
        </div>

        {courses.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-[15px] leading-7 text-[#5D6574]">
            No courses are published yet. Try the{" "}
            <Link
              href="/"
              className="text-[#EF542D] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
            >
              homepage search
            </Link>{" "}
            instead.
          </p>
        )}
      </main>
    </div>
  );
}

function CoursesPageFallback() {
  return (
    <div className="min-h-screen bg-[#fffaf7]" aria-busy="true">
      <SiteHeader coursesHref="/courses" coursesActive font="serif" />
      <main className="mx-auto w-full max-w-[1024px] px-5 pb-20 pt-12 sm:px-[52px]">
        <h1 className="font-display text-[32px] leading-tight tracking-[-0.025em] text-[#111111] sm:text-[38px]">
          All Courses
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[#5D6574]">
          Loading courses…
        </p>
      </main>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesPageFallback />}>
      <CoursesPageContent />
    </Suspense>
  );
}
