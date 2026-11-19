import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons/VertexIcons";
import { CourseCard } from "@/components/course/CourseCard";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getCourses } from "@/sanity/lib/data";
import "./home.css";

export const metadata: Metadata = {
  title: "Vertex | Intelligent Learning",
  description:
    "Search your learning in plain English and find the exact lessons across all your courses.",
};

const skylineHeights = [88, 121, 154, 188, 132, 97, 76, 113, 153, 188, 96, 127, 145];

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </svg>
  );
}

function Star() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="m12 2.8 2.75 5.58 6.16.9-4.46 4.34 1.05 6.14L12 16.87l-5.5 2.89 1.05-6.14-4.46-4.34 6.16-.9L12 2.8Z" />
    </svg>
  );
}

export default async function Home() {
  const allCourses = await getCourses();
  const courses = [...allCourses]
    .sort(
      (a, b) =>
        Number(b.popular ?? false) - Number(a.popular ?? false) ||
        (a.title ?? "").localeCompare(b.title ?? ""),
    )
    .slice(0, 3);

  return (
    <div className="vertexHomeCanvas">
      <div className="vertexHomeFrame">
        <SiteHeader coursesActive />

        <main>
          <section
            aria-labelledby="home-heading"
            className="vertexHomeHero relative overflow-hidden border-b border-[#EEE1DA] px-5 pb-[53px] pt-[66px] sm:px-10"
          >
            <div className="relative z-10 mx-auto flex max-w-[1240px] flex-col items-center text-center">
              <p className="inline-flex h-10 items-center rounded-sm border border-[#EFDCD2] bg-white/30 px-[15px] text-[12px] font-medium tracking-[0.14em] text-[#E34F27] shadow-[0_8px_24px_rgba(225,91,45,0.04)]">
                INTELLIGENT LEARNING
              </p>

              <h1
                id="home-heading"
                className="mt-8 font-display text-[clamp(2.25rem,6.25vw,4rem)] leading-[1.12] tracking-[-0.035em] text-[#080808]"
              >
                <span className="block">Search your learning</span>
                <span className="block">in plain English.</span>
              </h1>

              <p className="mt-6 max-w-[530px] text-[16px] leading-[1.65] text-[#596171] sm:text-[20px]">
                Vertex understands what you want to learn and
                <br className="hidden sm:block" /> finds the exact lessons across all your courses.
              </p>

              <Link
                href="#courses"
                className="mt-8 inline-flex h-[56px] items-center justify-center gap-4 rounded-sm bg-[#ED6035] px-[23px] text-[17px] text-white shadow-[0_12px_24px_rgba(223,78,34,0.22),0_2px_5px_rgba(223,78,34,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#DE5129] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4 sm:h-[60px] sm:text-[18px]"
              >
                <span>Explore Courses</span>
                <ArrowRight className="h-6 w-6" />
              </Link>

              <form
                action="/search"
                method="get"
                role="search"
                className="mt-[42px] flex h-[72px] w-full max-w-[746px] items-center gap-3 rounded-md border border-[#EBDDD5] bg-white/80 px-4 shadow-[0_14px_36px_rgba(120,74,47,0.08),0_2px_5px_rgba(120,74,47,0.04)] transition-colors focus-within:border-primary-400 sm:h-[86px] sm:gap-[18px] sm:px-[23px]"
              >
                <label htmlFor="home-search" className="sr-only">
                  Search your learning
                </label>
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#363B43] transition-colors hover:bg-primary-100 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <SearchIcon size={29} />
                </button>
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Ask anything about your learning..."
                  className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-neutral-900 outline-none placeholder:text-[#949AAA] sm:text-[20px]"
                />
                <kbd className="inline-flex h-11 shrink-0 items-center rounded-sm border border-[#E7D9D1] bg-[#FFFCFA] px-[14px] font-sans text-[16px] text-[#454750] shadow-sm">
                  ⌘ K
                </kbd>
              </form>
            </div>
          </section>

          <section id="courses" aria-labelledby="courses-heading" className="pt-[51px]">
            <div className="mx-auto w-full max-w-[1024px] px-5 sm:px-[52px]">
              <div className="flex items-center justify-between gap-5">
                <h2
                  id="courses-heading"
                  className="font-display text-[27px] leading-9 tracking-[-0.025em] text-[#111111]"
                >
                  All Courses
                </h2>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-3 rounded-xs text-[14px] text-[#EF542D] transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
                >
                  <span>View all courses</span>
                  <ArrowRight className="h-[19px] w-[19px]" />
                </Link>
              </div>

              <div className="mt-[25px] grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            </div>
          </section>

          <div className="mx-auto mt-[68px] flex w-full max-w-[1024px] items-center justify-center gap-6 px-5 sm:px-[52px]">
            <span className="hidden h-px flex-1 bg-[#E9DBD3] sm:block" aria-hidden="true" />
            <p className="flex min-w-0 items-center gap-3 text-center text-[14px] text-[#4F5662] sm:shrink-0 sm:gap-6 sm:text-[16px]">
              <span className="text-[#F15A36]">
                <Star />
              </span>
              <span>New courses and lessons added every week.</span>
            </p>
            <span className="hidden h-px flex-1 bg-[#E9DBD3] sm:block" aria-hidden="true" />
          </div>

          <div className="vertexHomeSkyline" aria-hidden="true">
            {skylineHeights.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="vertexHomeSkylineBar"
                style={{ "--bar-height": `${height}px` } as CSSProperties}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
