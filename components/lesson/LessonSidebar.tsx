"use client";

import Link from "next/link";
import { useState } from "react";

import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  PlayIcon,
} from "@/components/icons/VertexIcons";

export interface SidebarLesson {
  _id: string;
  title: string;
  slug: string;
  durationLabel: string;
}

export interface SidebarModule {
  _key: string;
  title: string;
  durationLabel: string;
  moduleNumber: number;
  lessons: SidebarLesson[];
}

export interface LessonSidebarProps {
  course: { title: string; slug: string };
  modules: SidebarModule[];
  currentLessonId: string;
  moduleNumber: number;
}

function toggleKey(open: Set<string>, key: string) {
  const next = new Set(open);

  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }

  return next;
}

export function LessonSidebar({
  course,
  modules,
  currentLessonId,
  moduleNumber,
}: LessonSidebarProps) {
  const currentModuleKey =
    modules.find((module) => module.moduleNumber === moduleNumber)?._key ??
    modules[0]?._key
  const [listOpen, setListOpen] = useState(true);
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(currentModuleKey ? [currentModuleKey] : []),
  );

  const monogram = course.title.trim().charAt(0).toUpperCase() || "V";

  return (
    <aside aria-label="Course curriculum" className="flex flex-col gap-5">
      <Link
        href={`/courses/${course.slug}`}
        className="inline-flex w-fit items-center gap-2 font-display text-[15px] text-primary-500 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon size={16} />
        Back to course
      </Link>

      <div className="rounded-[14px] border border-[#EBE1DB] bg-white p-5">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#111111] font-display text-[30px] leading-none text-white"
          >
            {monogram}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-bold leading-snug text-[#111111]">
              {course.title}
            </h2>
            <p className="mt-1 text-[12px] text-[#596171]">0% complete</p>
            <ProgressBar value={0} showLabel={false} className="mt-2" />
          </div>
        </div>

        <hr className="my-4 border-[#F1E9E4]" />

        <button
          type="button"
          aria-expanded={listOpen}
          aria-controls="lesson-module-list"
          onClick={() => setListOpen((open) => !open)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          <span className="text-[14px] font-semibold text-[#111111]">
            Module {moduleNumber} of {modules.length}
          </span>
          <ChevronDownIcon
            size={16}
            className={`text-[#596171] transition-transform ${
              listOpen ? "" : "-rotate-90"
            }`}
          />
        </button>

        <div id="lesson-module-list" hidden={!listOpen}>
          <hr className="my-4 border-[#F1E9E4]" />

          <ul className="flex flex-col">
            {modules.map((module) => {
              const isOpen = openModules.has(module._key);
              const isCurrent = module.moduleNumber === moduleNumber;

              return (
                <li key={module._key} className="py-0.5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`module-panel-${module._key}`}
                    onClick={() =>
                      setOpenModules((open) => toggleKey(open, module._key))
                    }
                    className="flex w-full cursor-pointer items-start gap-3 rounded-md px-1 py-2 text-left transition-colors hover:bg-[#FFF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold ${
                        isCurrent
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-[#E7DDD6] bg-white text-[#596171]"
                      }`}
                    >
                      {module.moduleNumber}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[#111111]">
                        {module.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-[#596171]">
                        {module.durationLabel}
                      </span>
                    </span>
                    <ChevronDownIcon
                      size={14}
                      className={`mt-1 shrink-0 text-[#596171] transition-transform ${
                        isOpen ? "" : "-rotate-90"
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <ul
                      id={`module-panel-${module._key}`}
                      className="mb-1 ml-3.5 mt-1 border-l border-[#EFE6E0]"
                    >
                      {module.lessons.map((lesson) => {
                        const isCurrent = lesson._id === currentLessonId;

                        return (
                          <li
                            key={lesson._id}
                            className="relative py-1 pl-5 pr-1"
                          >
                            <span
                              aria-hidden="true"
                              className={`absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 ${
                                isCurrent
                                  ? "border-primary-500 bg-primary-500"
                                  : "border-[#D9CEC7] bg-white"
                              }`}
                            />
                            <Link
                              href={`/lessons/${lesson.slug}`}
                              aria-current={isCurrent ? "page" : undefined}
                              className="flex items-center justify-between gap-2 rounded-md transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                            >
                              <span className="min-w-0">
                                <span
                                  className={`block text-[13px] leading-snug text-[#111111] ${
                                    isCurrent ? "font-medium" : ""
                                  }`}
                                >
                                  {lesson.title}
                                </span>
                                {isCurrent ? (
                                  <span className="mt-0.5 block text-[12px] text-primary-500">
                                    Now playing
                                  </span>
                                ) : (
                                  <span className="mt-0.5 block text-[12px] text-[#596171]">
                                    {lesson.durationLabel}
                                  </span>
                                )}
                              </span>
                              {isCurrent && (
                                <span
                                  aria-hidden="true"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white"
                                >
                                  <PlayIcon size={12} />
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
