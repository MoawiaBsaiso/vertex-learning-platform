import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LessonViewed } from "@/components/analytics/LessonViewed";
import { LessonCompleted } from "@/components/analytics/LessonCompleted";
import { BookmarkButton } from "@/components/course/BookmarkButton";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChartIcon,
  ClockIcon,
  UsersIcon,
} from "@/components/icons/VertexIcons";
import { LessonSidebar } from "@/components/lesson/LessonSidebar";
import { LessonTabs } from "@/components/lesson/LessonTabs";
import { LessonVideo } from "@/components/lesson/LessonVideo";
import { Breadcrumbs } from "@/components/navigation/Navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getLessonBySlug, getLessonSlugs } from "@/sanity/lib/data";
import { formatDuration } from "@/sanity/lib/format";
import { urlFor } from "@/sanity/lib/image";
import type { BlockContent } from "@/sanity.types";

import "../../course.css";

type LessonPageProps = {
  params: Promise<{ slug: string }>;
};

type NotesBlock = Extract<BlockContent[number], { _type: "block" }>;

const footerLinkClasses =
  "inline-flex h-[44px] shrink-0 items-center gap-2 rounded-md px-5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2";

function firstNotesBlock(notes: BlockContent | null): NotesBlock | null {
  if (!notes) {
    return null;
  }

  const block = notes.find(
    (item): item is NotesBlock =>
      item._type === "block" &&
      !item.listItem &&
      (item.style ?? "normal") === "normal",
  );

  return block ?? null;
}

function blockToPlainText(block: NotesBlock): string | null {
  const text = (block.children ?? [])
    .map((child) => ("text" in child ? (child.text ?? "") : ""))
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

export async function generateStaticParams() {
  const slugs = await getLessonSlugs();

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);

  if (!lesson) {
    return { title: "Lesson | Vertex" };
  }

  const overview = firstNotesBlock(lesson.notes);
  const description =
    (overview ? blockToPlainText(overview) : null) ??
    lesson.context?.module.summary ??
    lesson.context?.course.summary ??
    undefined;

  return {
    title: `${lesson.title ?? "Lesson"} | Vertex`,
    description: description ?? undefined,
  };
}

async function LessonPageContent({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  const context = lesson.context;
  const overviewBlock = firstNotesBlock(lesson.notes);
  const overview = overviewBlock ? [overviewBlock] : null;
  const resources = (lesson.resources ?? []).filter(
    (resource) => resource !== null,
  );
  const thumbnailSrc = lesson.thumbnail
    ? urlFor(lesson.thumbnail).width(1280).auto("format").url()
    : null;
  const levelLabel = context?.course.level
    ? context.course.level.charAt(0).toUpperCase() +
      context.course.level.slice(1)
    : null;
  const studentCount = (lesson.studentCount ?? 0).toLocaleString("en-US");
  const breadcrumbItems = [
    { label: "All Courses", href: "/courses" },
    ...(context
      ? [
          {
            label: context.course.title,
            href: `/courses/${context.course.slug}`,
          },
          { label: context.module.title },
        ]
      : []),
    { label: lesson.title ?? "" },
  ];

  return (
    <div className="vertexCourseCanvas">
      <div className="vertexCourseFrame">
        <SiteHeader font="serif" coursesHref="/courses" />

        <main>
          <LessonViewed
            lessonId={lesson._id}
            lessonSlug={slug}
            lessonTitle={lesson.title ?? slug}
            courseId={context?.course._id ?? ""}
            courseSlug={context?.course.slug ?? ""}
          />

          <LessonCompleted
            lessonId={lesson._id}
            lessonSlug={slug}
            lessonTitle={lesson.title ?? slug}
            courseId={context?.course._id ?? ""}
            courseSlug={context?.course.slug ?? ""}
          />

          <div className="mx-auto max-w-[1024px] px-5 pb-14 pt-6 sm:px-16">
            <div className="grid gap-8 lg:grid-cols-[247px_minmax(0,1fr)] lg:gap-x-[35px]">
              {context && (
                <div className="lg:pl-[10px]">
                  <LessonSidebar
                    course={{
                      title: context.course.title,
                      slug: context.course.slug,
                    }}
                    modules={context.modules}
                    currentLessonId={context.currentLessonId}
                    moduleNumber={context.moduleNumber}
                  />
                </div>
              )}

              <div className="min-w-0">
                <Breadcrumbs
                  items={breadcrumbItems}
                  textClassName="text-[14px]"
                />

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {context && (
                    <span className="rounded-md bg-[#FBEFE8] px-2.5 py-[3px] text-[11px] font-bold uppercase leading-[1.5] tracking-[0.08em] text-[#B23A30]">
                      Lesson {context.lessonLabel}
                    </span>
                  )}
                  {lesson.freePreview && (
                    <span className="rounded-md bg-[#FBEFE8] px-2.5 py-[3px] text-[11px] font-bold uppercase leading-[1.5] tracking-[0.08em] text-[#B23A30]">
                      Free preview
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <h1 className="font-display text-[38px] leading-[1.06] tracking-[-0.02em] text-[#111111] sm:text-[46px] lg:text-[52px]">
                    {lesson.title}
                  </h1>
                  <BookmarkButton
                    iconOnly
                    ariaLabel="Bookmark this lesson"
                    courseSlug={context?.course.slug}
                    courseTitle={lesson.title ?? undefined}
                    className="mt-2 shrink-0"
                  />
                </div>

                {(context?.module.summary ?? context?.course.summary) && (
                  <p className="mt-4 max-w-[470px] text-[16px] leading-[1.65] text-[#596171]">
                    {context?.module.summary ?? context?.course.summary}
                  </p>
                )}

                <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[#4F5868]">
                  <li className="flex items-center gap-2">
                    <ClockIcon size={18} className="text-[#30343B]" />
                    {formatDuration(lesson.duration)}
                  </li>
                  {levelLabel && (
                    <li className="flex items-center gap-2">
                      <BarChartIcon size={18} className="text-[#30343B]" />
                      {levelLabel}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <UsersIcon size={18} className="text-[#30343B]" />
                    {studentCount} students
                  </li>
                </ul>

                <div className="mt-5">
                  <LessonVideo
                    videoUrl={lesson.videoUrl ?? null}
                    duration={lesson.duration ?? null}
                    thumbnailSrc={thumbnailSrc}
                    title={lesson.title ?? "Lesson"}
                  />
                </div>

                <div className="mt-7 lg:pl-5">
                  <LessonTabs
                    notes={lesson.notes ?? null}
                    overview={overview}
                    keyPoints={lesson.keyPoints ?? []}
                    proTip={lesson.proTip ?? null}
                    resources={resources}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {context && (
          <footer className="border-t border-[#EEE1DA] bg-[#FFFDFB] py-6">
            <div className="mx-auto flex max-w-[1024px] flex-col gap-5 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-14">
              {context.previousLesson ? (
                <div className="flex items-center gap-4 sm:gap-8">
                  <Link
                    href={`/lessons/${context.previousLesson.slug}`}
                    className={`${footerLinkClasses} border border-[#E5DBD4] bg-white text-[#111111] hover:bg-[#FFF8F4]`}
                  >
                    <ArrowLeftIcon size={16} className="text-[#6A4937]" />
                    Previous Lesson
                  </Link>
                  <div className="min-w-0">
                    <p className="text-[14px] font-normal leading-tight text-[#111111]">
                      {context.previousLesson.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-tight text-[#596171]">
                      {context.previousLesson.durationLabel}
                    </p>
                  </div>
                </div>
              ) : null}

              {context.nextLesson ? (
                <div className="flex items-center gap-4 sm:ml-auto sm:gap-8">
                  <div className="min-w-0 text-left sm:text-right">
                    <p className="text-[14px] font-normal leading-tight text-[#111111]">
                      {context.nextLesson.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-tight text-[#596171]">
                      {context.nextLesson.durationLabel}
                    </p>
                  </div>
                  <Link
                    href={`/lessons/${context.nextLesson.slug}`}
                    className={`${footerLinkClasses} bg-primary-500 text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] hover:bg-primary-600`}
                  >
                    Next Lesson
                    <ArrowRightIcon size={16} />
                  </Link>
                </div>
              ) : null}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function LessonPageFallback() {
  return (
    <div className="vertexCourseCanvas" aria-busy="true">
      <div className="vertexCourseFrame">
        <SiteHeader font="serif" coursesHref="/courses" />
        <main className="mx-auto max-w-[1024px] px-5 py-16 sm:px-16">
          <p className="font-display text-[18px] text-[#596171]">
            Loading lesson…
          </p>
        </main>
      </div>
    </div>
  );
}

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <Suspense fallback={<LessonPageFallback />}>
      <LessonPageContent params={params} />
    </Suspense>
  );
}
