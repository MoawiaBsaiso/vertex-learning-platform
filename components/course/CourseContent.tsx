"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useState } from "react";

import { ChevronDownIcon } from "@/components/icons/VertexIcons";

export interface CourseContentLesson {
  _id: string;
  title: string;
  slug: string;
  durationLabel: string;
}

export interface CourseContentModule {
  _key: string;
  title: string;
  summary: string | null;
  durationLabel: string;
  lessons: CourseContentLesson[];
}

export interface CourseContentProps {
  courseId: string;
  courseSlug: string;
  modules: CourseContentModule[];
  className?: string;
}

const VISIBLE_MODULES = 6;

export function CourseContent({
  courseId,
  courseSlug,
  modules,
  className = "",
}: CourseContentProps) {
  const [showAll, setShowAll] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const visibleModules = showAll ? modules : modules.slice(0, VISIBLE_MODULES);
  const hiddenCount = modules.length - VISIBLE_MODULES;

  const toggleModule = (key: string, isOpen: boolean) => {
    posthog.capture("course_module_toggled", {
      course_id: courseId,
      course_slug: courseSlug,
      module_key: key,
      is_expanded: !isOpen,
    });

    setOpenKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-[14px] border border-[#EBE1DB] bg-white/55">
        <ul className="divide-y divide-[#F0E7E1]">
          {visibleModules.map((module, index) => {
            const isOpen = openKeys.includes(module._key);
            const panelId = `module-panel-${module._key}`;

            return (
              <li key={module._key}>
                <button
                  type="button"
                  onClick={() => toggleModule(module._key, isOpen)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-[18px] text-left transition-colors hover:bg-[#FFF9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 sm:gap-5 sm:px-6"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DFD4CC] font-display text-[15px] text-[#3A3F47]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[16px] font-medium text-[#14161A]">
                      {module.title}
                    </span>
                    {module.summary && (
                      <span className="mt-1 hidden font-display text-[14px] leading-[1.45] text-[#5B6472] sm:block">
                        {module.summary}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-sans text-[14px] text-neutral-500">
                    {module.durationLabel}
                  </span>
                  <ChevronDownIcon
                    size={20}
                    className={`shrink-0 text-neutral-500 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <ul id={panelId} className="pb-2">
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson._id}
                        className="border-t border-[#F5EDE8]"
                      >
                        <Link
                          href={`/lessons/${lesson.slug}`}
                          onClick={() =>
                            posthog.capture("lesson_started", {
                              course_id: courseId,
                              course_slug: courseSlug,
                              module_key: module._key,
                              lesson_id: lesson._id,
                              lesson_slug: lesson.slug,
                            })
                          }
                          className="flex items-center justify-between gap-4 py-3 pl-[64px] pr-5 transition-colors hover:bg-[#FFF9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 sm:pl-[76px] sm:pr-6"
                        >
                          <span className="min-w-0 truncate font-display text-[15px] text-[#2C313A]">
                            {lesson.title}
                          </span>
                          <span className="shrink-0 font-sans text-[13px] text-neutral-500">
                            {lesson.durationLabel}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {hiddenCount > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex h-11 cursor-pointer items-center gap-3 rounded-md border border-[#E5DBD4] bg-white px-5 font-display text-[15px] text-[#1F2228] shadow-sm transition-colors hover:bg-[#FFF9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            {showAll
              ? "Show fewer modules"
              : `Show all ${modules.length} modules`}
            <ChevronDownIcon
              size={18}
              className={`transition-transform duration-200 ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
