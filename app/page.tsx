import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChartIcon,
  BellIcon,
  ClockIcon,
  DocumentIcon,
  SearchIcon,
  VertexLogo,
} from "@/components/icons/VertexIcons";
import profileImage from "@/public/images/vertex-profile.png";
import "./home.css";

export const metadata: Metadata = {
  title: "Vertex | Intelligent Learning",
  description:
    "Search your learning in plain English and find the exact lessons across all your courses.",
};

const courses = [
  {
    brand: "next",
    title: "Next.js for Production",
    description:
      "Build scalable, high-performance web applications with Next.js.",
    level: "Intermediate",
    duration: "18h 24m",
    modules: "12 modules",
  },
  {
    brand: "docker",
    title: "Docker Essentials",
    description:
      "Containerize applications and streamline your development workflow.",
    level: "Beginner",
    duration: "10h 12m",
    modules: "8 modules",
  },
  {
    brand: "typescript",
    title: "TypeScript Deep Dive",
    description:
      "Go beyond the basics and write safer, more expressive code.",
    level: "Intermediate",
    duration: "14h 36m",
    modules: "10 modules",
  },
] as const;

const skylineHeights = [88, 121, 154, 188, 132, 97, 76, 113, 153, 188, 96, 127, 145];

function CourseMark({ brand }: { brand: (typeof courses)[number]["brand"] }) {
  if (brand === "next") {
    return (
      <svg
        viewBox="0 0 74 74"
        className="h-[74px] w-[74px]"
        role="img"
        aria-label="Next.js"
      >
        <defs>
          <linearGradient id="next-mark" x1="9" y1="5" x2="67" y2="70">
            <stop stopColor="#171717" />
            <stop offset="1" stopColor="#020202" />
          </linearGradient>
        </defs>
        <rect width="74" height="74" rx="10" fill="url(#next-mark)" />
        <path
          d="M19.5 54V20.5L47.5 54V20.5"
          fill="none"
          stroke="white"
          strokeWidth="5.2"
          strokeLinejoin="miter"
        />
        <path d="M47.5 44.5 61 61" stroke="white" strokeOpacity=".22" strokeWidth="5.2" />
      </svg>
    );
  }

  if (brand === "docker") {
    return (
      <svg
        viewBox="0 0 74 74"
        className="h-[74px] w-[74px]"
        role="img"
        aria-label="Docker"
      >
        <g fill="#3CA9F4" stroke="#0F172A" strokeWidth="1.35">
          <rect x="12" y="29" width="9" height="8" rx="1" />
          <rect x="23" y="29" width="9" height="8" rx="1" />
          <rect x="34" y="29" width="9" height="8" rx="1" />
          <rect x="45" y="29" width="9" height="8" rx="1" />
          <rect x="23" y="19" width="9" height="8" rx="1" />
          <rect x="34" y="19" width="9" height="8" rx="1" />
          <rect x="34" y="9" width="9" height="8" rx="1" />
          <path d="M8 39h48c3 0 5-1 7-3 1.8 7.5-3.2 12.8-9 13.4C50.2 59.7 40.8 65 28.5 65 17 65 9.7 56.5 8 39Z" />
          <path d="M61 34c2.8-2.7 6.1-2.4 8.5-1.2-1.2 3.3-4.2 5.7-8.4 5.5" />
        </g>
        <circle cx="14.5" cy="44.5" r="1.45" fill="#0F172A" />
        <path d="M9 49h50" stroke="white" strokeOpacity=".65" strokeWidth="1.4" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 74 74"
      className="h-[74px] w-[74px]"
      role="img"
      aria-label="TypeScript"
    >
      <defs>
        <linearGradient id="typescript-mark" x1="7" y1="5" x2="67" y2="69">
          <stop stopColor="#3D91E8" />
          <stop offset="1" stopColor="#286ABD" />
        </linearGradient>
      </defs>
      <rect width="74" height="74" rx="10" fill="url(#typescript-mark)" />
      <text
        x="10"
        y="52"
        fill="white"
        fontFamily="Arial, sans-serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="-2"
      >
        TS
      </text>
    </svg>
  );
}

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

export default function Home() {
  return (
    <div className="vertexHomeCanvas">
      <div className="vertexHomeFrame">
        <header className="relative z-10 border-b border-[#EEE1DA]">
          <div className="mx-auto flex min-h-[98px] w-full max-w-[1024px] flex-wrap items-center gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-[42px] sm:py-0">
            <Link
              href="/"
              aria-label="Vertex home"
              className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
            >
              <VertexLogo className="gap-2.5 [&>span]:text-[24px] [&>svg]:h-[34px] [&>svg]:w-[36px]" />
            </Link>

            <nav
              aria-label="Primary navigation"
              className="order-3 flex w-full items-center gap-8 text-[15px] text-[#111111] sm:order-none sm:ml-[62px] sm:w-auto sm:gap-[43px]"
            >
              <Link
                href="#courses"
                aria-current="page"
                className="rounded-xs transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
              >
                Courses
              </Link>
              <Link
                href="/my-learning"
                className="rounded-xs transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
              >
                My Learning
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-[18px] sm:gap-[21px]">
              <button
                type="button"
                aria-label="Open notifications"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#30343B] transition-colors hover:bg-[#FFF3EC] hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                <BellIcon size={25} />
              </button>
              <Image
                src={profileImage}
                alt="Vertex learner profile"
                className="h-[53px] w-[53px] rounded-full object-cover"
                sizes="53px"
              />
            </div>
          </div>
        </header>

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
                  href="#courses"
                  className="inline-flex items-center gap-3 rounded-xs text-[14px] text-[#EF542D] transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
                >
                  <span>View all courses</span>
                  <ArrowRight className="h-[19px] w-[19px]" />
                </Link>
              </div>

              <div className="mt-[25px] grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <article
                    key={course.title}
                    className="vertexHomeCourseCard flex min-h-[374px] flex-col rounded-lg border border-[#E9DBD3] bg-white/55 px-[26px] pb-[27px] pt-[31px]"
                  >
                    <CourseMark brand={course.brand} />
                    <h3 className="mt-[27px] font-display text-[22px] leading-[30px] tracking-[-0.025em] text-[#121212]">
                      {course.title}
                    </h3>
                    <p className="mt-[13px] text-[14px] leading-[25px] text-[#5D6574]">
                      {course.description}
                    </p>

                    <div className="-mx-[9px] mt-auto flex items-center justify-between gap-2 border-t border-[#E9DBD3] px-[9px] pt-[20px] text-[10px] text-[#4F5868]">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <BarChartIcon size={16} className="shrink-0" />
                        {course.level}
                      </span>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <ClockIcon size={16} className="shrink-0" />
                        {course.duration}
                      </span>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <DocumentIcon size={16} className="shrink-0" />
                        {course.modules}
                      </span>
                    </div>
                  </article>
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
