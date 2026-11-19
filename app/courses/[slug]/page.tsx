import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookmarkButton } from "@/components/course/BookmarkButton";
import {
  CourseContent,
  type CourseContentModule,
} from "@/components/course/CourseContent";
import {
  ArrowRightIcon,
  BarChartIcon,
  BookIcon,
  ClockIcon,
  CodeIcon,
  DatabaseIcon,
  DocumentIcon,
  LayersIcon,
  RocketIcon,
  ShieldIcon,
  TargetIcon,
  TerminalIcon,
  UsersIcon,
} from "@/components/icons/VertexIcons";
import { Breadcrumbs } from "@/components/navigation/Navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getCourseBySlug, getCourseSlugs } from "@/sanity/lib/data";
import { formatDuration } from "@/sanity/lib/format";
import { urlFor } from "@/sanity/lib/image";

import "../../course.css";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

const outcomeIcons = {
  book: BookIcon,
  clock: ClockIcon,
  code: CodeIcon,
  database: DatabaseIcon,
  layers: LayersIcon,
  rocket: RocketIcon,
  shield: ShieldIcon,
  target: TargetIcon,
  terminal: TerminalIcon,
} as const;

const ctaClasses =
  "inline-flex h-[48px] items-center justify-center gap-2 rounded-md bg-primary-500 px-6 font-display text-[16px] text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2";

function formatStudents(count: number | null | undefined) {
  const value = count ?? 0;

  if (value >= 1000) {
    const thousands = Math.round((value / 1000) * 10) / 10;
    return `${thousands}k`;
  }

  return `${value}`;
}

export async function generateStaticParams() {
  const slugs = await getCourseSlugs();

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return { title: "Course | Vertex" };
  }

  return {
    title: `${course.title ?? "Course"} | Vertex`,
    description: course.summary ?? undefined,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const modules: CourseContentModule[] = (course.modules ?? []).map(
    (module, moduleIndex) => {
      const lessons = (module.lessons ?? []).filter(
        (lesson) =>
          typeof lesson.slug === "string" && lesson.slug.length > 0,
      );

      return {
        _key: module._key || String(moduleIndex),
        title: module.title ?? "",
        summary: module.summary ?? null,
        durationLabel: formatDuration(
          lessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0),
        ),
        lessons: lessons.map((lesson) => ({
          _id: lesson._id,
          title: lesson.title ?? "",
          slug: lesson.slug as string,
          durationLabel: formatDuration(lesson.duration),
        })),
      };
    },
  );

  const moduleCount = modules.length;
  const levelLabel = course.level
    ? course.level.charAt(0).toUpperCase() + course.level.slice(1)
    : null;
  const studentLabel = formatStudents(course.studentCount);
  const firstLessonSlug = modules[0]?.lessons[0]?.slug;
  const coverUrl = course.coverImage
    ? urlFor(course.coverImage).width(564).url()
    : null;
  const outcomes = course.learningOutcomes ?? [];

  return (
    <div className="vertexCourseCanvas">
      <div className="vertexCourseFrame">
        <SiteHeader font="serif" coursesHref="/courses" />

        <div className="border-b border-[#EEE1DA]">
          <div className="mx-auto max-w-[1024px] px-5 py-6 sm:px-16">
            <Breadcrumbs
              items={[
                { label: "All Courses", href: "/courses" },
                { label: course.title ?? "Course" },
              ]}
              textClassName="font-display text-[15px]"
            />
          </div>
        </div>

        <main>
          <section className="mx-auto max-w-[1024px] px-5 pt-5 sm:px-16">
            <div className="grid gap-10 lg:grid-cols-[282px_minmax(0,1fr)] lg:gap-[58px]">
              <div className="relative aspect-[282/324] w-full max-w-[460px] overflow-hidden rounded-2xl bg-[#F1E9E4] lg:max-w-none">
                {coverUrl && (
                  <Image
                    src={coverUrl}
                    alt={
                      course.title
                        ? `${course.title} course cover`
                        : "Course cover"
                    }
                    fill
                    sizes="(min-width: 1024px) 282px, (min-width: 640px) calc(100vw - 128px), calc(100vw - 40px)"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0">
                {course.popular && (
                  <span className="inline-flex items-center rounded-md bg-[#FDEAE2] px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[#E34F27]">
                    Popular
                  </span>
                )}

                <h1
                  className={`${
                    course.popular ? "mt-4" : ""
                  } font-display text-[36px] leading-[1.08] tracking-[-0.02em] text-[#111111] sm:text-[44px] lg:text-[52px]`}
                >
                  {course.title}
                </h1>

                {course.summary && (
                  <p className="mt-7 max-w-[410px] font-display text-[18px] leading-[1.6] text-[#596171]">
                    {course.summary}
                  </p>
                )}

                <ul className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 font-sans text-[14px] text-[#4F5868]">
                  {levelLabel && (
                    <li className="flex items-center gap-2">
                      <BarChartIcon size={19} className="text-[#30343B]" />
                      {levelLabel}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <ClockIcon size={19} className="text-[#30343B]" />
                    {course.durationLabel}
                  </li>
                  <li className="flex items-center gap-2">
                    <DocumentIcon size={19} className="text-[#30343B]" />
                    {moduleCount} module{moduleCount === 1 ? "" : "s"}
                  </li>
                  <li className="flex items-center gap-2">
                    <UsersIcon size={19} className="text-[#30343B]" />
                    {studentLabel} students
                  </li>
                </ul>

                {firstLessonSlug && (
                  <div className="mt-9 flex flex-wrap items-center gap-4">
                    <Link
                      href={`/lessons/${firstLessonSlug}`}
                      className={ctaClasses}
                    >
                      Continue Learning
                      <ArrowRightIcon size={18} />
                    </Link>
                    <BookmarkButton />
                  </div>
                )}
              </div>
            </div>
          </section>

          {outcomes.length > 0 && (
            <section
              aria-labelledby="learn-heading"
              className="mx-auto mt-8 max-w-[1024px] px-5 sm:px-16"
            >
              <div className="rounded-[14px] border border-[#EBE1DB] bg-white/60 p-6 sm:p-8">
                <h2
                  id="learn-heading"
                  className="font-display text-[26px] leading-tight text-[#111111] sm:text-[28px]"
                >
                  What you&apos;ll learn
                </h2>
                <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                  {outcomes.map((outcome) => {
                    const OutcomeIcon = outcome.icon
                      ? outcomeIcons[outcome.icon]
                      : null;

                    return (
                      <li
                        key={outcome._key}
                        className="flex gap-9 rounded-xl border border-[#EBE1DB] bg-white/50 p-6"
                      >
                        <span className="shrink-0 pt-1 text-[#E34F27]">
                          {OutcomeIcon && <OutcomeIcon size={44} />}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display text-[17px] font-medium text-[#111111]">
                            {outcome.title}
                          </h3>
                          {outcome.description && (
                            <p className="mt-1.5 font-display text-[15px] leading-[1.45] text-[#5B6472]">
                              {outcome.description}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          <section
            aria-labelledby="content-heading"
            className="mx-auto mt-14 max-w-[1024px] px-5 sm:px-16"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2
                id="content-heading"
                className="font-display text-[26px] leading-tight text-[#111111] sm:text-[28px]"
              >
                Course Content
              </h2>
              <p className="font-sans text-[14px] text-neutral-500">
                {moduleCount} module{moduleCount === 1 ? "" : "s"}
                <span aria-hidden="true" className="mx-2.5 text-neutral-300">
                  •
                </span>
                {course.durationLabel}
              </p>
            </div>

            <CourseContent modules={modules} className="mt-5" />
          </section>
        </main>

        <div className="sticky bottom-0 z-20 mx-auto mt-8 w-full max-w-[1024px] px-5 pb-[18px] sm:px-16">
          <div className="rounded-[14px] border border-[#F1E8E2] bg-white px-5 py-4 shadow-[0_16px_40px_rgba(94,55,35,0.12)] sm:px-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-8">
              <div className="min-w-0 shrink-0">
                <p className="font-sans text-[12px] leading-4 text-neutral-500">
                  Your Progress
                </p>
                <p className="mt-0.5 font-display text-[15px] leading-5 text-[#111111]">
                  <strong className="font-semibold">0%</strong> complete
                </p>
              </div>

              <div className="min-w-0 flex-1 basis-[160px]">
                <ProgressBar value={0} showLabel={false} />
              </div>

              {firstLessonSlug && (
                <Link
                  href={`/lessons/${firstLessonSlug}`}
                  className={`order-last w-full sm:order-none sm:w-auto sm:shrink-0 ${ctaClasses}`}
                >
                  Continue Learning
                  <ArrowRightIcon size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1]"
        >
          <div className="vertexCoursePeachBlock vertexCoursePeachBlockLeft" />
          <div className="vertexCoursePeachBlock vertexCoursePeachBlockRight" />
          <div className="vertexCourseAccentBar" />
        </div>
      </div>
    </div>
  );
}
