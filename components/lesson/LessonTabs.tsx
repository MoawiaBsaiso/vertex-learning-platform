"use client";

import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { useState } from "react";

import { urlFor } from "@/sanity/lib/image";
import type { BlockContent } from "@/sanity.types";
import {
  BulbIcon,
  CheckCircleIcon,
  CodeIcon,
  DocumentIcon,
  ExternalLinkIcon,
  GithubIcon,
} from "@/components/icons/VertexIcons";

export interface LessonResource {
  _key: string;
  type?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
}

export interface LessonTabsProps {
  notes: BlockContent | null;
  overview: BlockContent | null;
  keyPoints: string[];
  proTip: string | null;
  resources: LessonResource[];
}

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 text-[15px] leading-[1.75] text-[#2C313A] last:mb-0">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 font-display text-[24px] font-medium text-[#111111] first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 font-display text-[19px] font-medium text-[#111111] first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-5 border-l-2 border-primary-300 pl-4 text-[15px] italic leading-[1.75] text-[#596171]">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-5 list-disc space-y-2 pl-6 text-[15px] leading-[1.7] text-[#2C313A]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-5 list-decimal space-y-2 pl-6 text-[15px] leading-[1.7] text-[#2C313A]">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="marker:text-primary-500">{children}</li>
    ),
    number: ({ children }) => (
      <li className="marker:text-primary-500">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-[#111111]">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-[#F6EFEA] px-1.5 py-0.5 font-mono text-[13px] text-[#9A3412]">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = value?.href;

      if (!href) {
        return <>{children}</>;
      }

      const newTab = value?.openInNewTab !== false;

      return (
        <a
          href={href}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
          className="text-primary-500 underline underline-offset-4 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) {
        return null;
      }

      const src = urlFor(value).width(1200).auto("format").url();

      return (
        <span className="relative my-6 block aspect-[3/2] w-full overflow-hidden rounded-xl">
          <Image
            src={src}
            alt={value.alt ?? ""}
            fill
            sizes="(min-width: 1024px) 610px, 100vw"
            className="object-cover"
          />
        </span>
      );
    },
  },
};

function resourceIcon(type?: string | null) {
  let icon = <DocumentIcon size={18} />;

  if (type === "repo") {
    icon = <GithubIcon size={18} />;
  } else if (type === "code") {
    icon = <CodeIcon size={18} />;
  }

  return (
    <span className="mt-px flex size-7 shrink-0 items-center justify-center rounded-md bg-[#F7E8DF] text-primary-500">
      {icon}
    </span>
  );
}

type TabId = "content" | "notes";

export function LessonTabs({
  notes,
  overview,
  keyPoints,
  proTip,
  resources,
}: LessonTabsProps) {
  const hasNotes = Boolean(notes && notes.length > 0);
  const tabs: { id: TabId; label: string }[] = [
    { id: "content", label: "Lesson Content" },
    ...(hasNotes ? [{ id: "notes" as const, label: "Notes" }] : []),
  ];
  const [active, setActive] = useState<TabId>("content");

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (index + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];

    setActive(nextTab.id);
    document.getElementById(`lesson-tab-${nextTab.id}`)?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Lesson content"
        className="flex gap-7 border-b border-[#EFE6E0]"
      >
        {tabs.map((tab, index) => {
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`lesson-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`lesson-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`relative cursor-pointer pb-3.5 pt-1 font-display text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${
                isActive
                  ? "text-primary-500"
                  : "text-[#596171] hover:text-[#111111]"
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-primary-500"
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="lesson-panel-content"
        aria-labelledby="lesson-tab-content"
        hidden={active !== "content"}
        className="pt-6"
      >
        <h2 className="font-display text-[16px] font-medium text-[#111111]">
          Overview
        </h2>
        {overview && (
          <div className="mt-3.5">
            <PortableText
              value={overview}
              components={portableTextComponents}
              onMissingComponent={false}
            />
          </div>
        )}

        <hr className="my-7 border-[#EFE6E0]" />

        <h3 className="text-[13px] font-semibold text-[#111111]">
          In this lesson you will:
        </h3>
        <ul className="mt-4 flex flex-col gap-3.5">
          {keyPoints.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <CheckCircleIcon
                size={20}
                className="mt-0.5 shrink-0 text-primary-500"
              />
              <span className="text-[15px] leading-snug text-[#2C313A]">
                {point}
              </span>
            </li>
          ))}
        </ul>

        {proTip && (
          <div className="mt-7 flex items-start gap-3.5 rounded-xl bg-[#FDF1EC] p-5">
            <BulbIcon
              size={20}
              className="mt-0.5 shrink-0 text-primary-500"
            />
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[#111111]">Pro Tip</p>
              <p className="mt-1.5 text-[14px] leading-[1.65] text-[#596171]">
                {proTip}
              </p>
            </div>
          </div>
        )}

        {resources.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-[16px] font-medium text-[#111111]">
              Resources
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map(
                (resource) =>
                  resource.url && (
                    <a
                      key={resource._key}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-[10px] border border-[#EBE1DB] bg-white p-4 transition-colors hover:border-primary-300 hover:bg-[#FFFBF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="flex min-w-0 items-start gap-2.5">
                          {resourceIcon(resource.type)}
                          <span className="text-[13px] font-bold leading-snug text-[#111111]">
                            {resource.title}
                          </span>
                        </span>
                        <ExternalLinkIcon
                          size={14}
                          className="mt-0.5 shrink-0 text-[#976A54] transition-colors group-hover:text-primary-500"
                        />
                      </span>
                      {resource.description && (
                        <span className="mt-2 line-clamp-2 text-[12px] leading-snug text-[#666568]">
                          {resource.description}
                        </span>
                      )}
                    </a>
                  ),
              )}
            </div>
          </section>
        )}
      </div>

      {hasNotes && (
        <div
          role="tabpanel"
          id="lesson-panel-notes"
          aria-labelledby="lesson-tab-notes"
          hidden={active !== "notes"}
          className="pt-6"
        >
          <PortableText
            value={notes ?? []}
            components={portableTextComponents}
            onMissingComponent={false}
          />
        </div>
      )}
    </div>
  );
}
