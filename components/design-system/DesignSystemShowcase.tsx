"use client";

import React, { useState } from "react";
import {
  AccessibilityIcon,
  BarChartIcon,
  BellIcon,
  BookmarkIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentIcon,
  ExternalLinkIcon,
  EyeIcon,
  GridIcon,
  PlayCircleIcon,
  SearchIcon,
  TargetIcon,
  UserIcon,
  VertexLogo,
} from "@/components/icons/VertexIcons";
import { Button } from "@/components/ui/Button";
import { SearchInput, SelectInput } from "@/components/ui/Input";
import { Badge, StatusIndicator } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CourseCard,
  LessonTopicCard,
  LessonVideoCard,
  ResourceCard,
} from "@/components/cards/Cards";
import {
  Breadcrumbs,
  NavBar,
  Pagination,
} from "@/components/navigation/Navigation";

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-sans text-[11px] font-bold tracking-[0.06em] text-primary-500">
        {number}
      </span>
      <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-900">
        {title}
      </h2>
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

const PRIMARY_COLORS = [
  { name: "Primary 500", hex: "#F97316", className: "bg-primary-500" },
  { name: "Primary 400", hex: "#FB923C", className: "bg-primary-400" },
  { name: "Primary 300", hex: "#FDBA74", className: "bg-primary-300" },
  { name: "Primary 200", hex: "#FED7AA", className: "bg-primary-200" },
  { name: "Primary 100", hex: "#FFEEE5", className: "bg-primary-100" },
];

const NEUTRAL_COLORS = [
  { name: "Neutral 900", hex: "#0F172A", className: "bg-neutral-900" },
  { name: "Neutral 700", hex: "#334155", className: "bg-neutral-700" },
  { name: "Neutral 500", hex: "#64748B", className: "bg-neutral-500" },
  { name: "Neutral 300", hex: "#CBD5E1", className: "bg-neutral-300" },
  { name: "Neutral 200", hex: "#E2E8F0", className: "bg-neutral-200" },
  { name: "Neutral 100", hex: "#F1F5F9", className: "bg-neutral-100" },
  {
    name: "Neutral 50",
    hex: "#FAFAFC",
    className: "bg-neutral-50 border border-neutral-200",
  },
  {
    name: "White",
    hex: "#FFFFFF",
    className: "bg-white border border-neutral-200",
  },
];

const TYPE_SCALE_ROWS = [
  {
    style: "Display 1",
    sampleClass: "font-display text-[20px] font-bold leading-7 text-neutral-900",
    font: "Playfair Display",
    size: "48 / 56",
    weight: "Bold",
    use: "Page titles",
  },
  {
    style: "Display 2",
    sampleClass: "font-display text-[17px] font-bold leading-6 text-neutral-900",
    font: "Playfair Display",
    size: "36 / 44",
    weight: "Bold",
    use: "Section titles",
  },
  {
    style: "Heading 1",
    sampleClass: "font-sans text-[16px] font-semibold leading-6 text-neutral-900",
    font: "Inter",
    size: "28 / 36",
    weight: "Semi Bold",
    use: "Card titles",
  },
  {
    style: "Heading 2",
    sampleClass: "font-sans text-[15px] font-semibold leading-5 text-neutral-900",
    font: "Inter",
    size: "22 / 30",
    weight: "Semi Bold",
    use: "Sub section",
  },
  {
    style: "Heading 3",
    sampleClass: "font-sans text-[14px] font-medium leading-5 text-neutral-900",
    font: "Inter",
    size: "18 / 26",
    weight: "Medium",
    use: "Small titles",
  },
  {
    style: "Body Large",
    sampleClass: "font-sans text-[14px] font-normal leading-5 text-neutral-900",
    font: "Inter",
    size: "16 / 24",
    weight: "Regular",
    use: "Body copy",
  },
  {
    style: "Body",
    sampleClass: "font-sans text-[13px] font-normal leading-5 text-neutral-900",
    font: "Inter",
    size: "14 / 20",
    weight: "Regular",
    use: "Supporting text",
  },
  {
    style: "Small",
    sampleClass: "font-sans text-[12px] font-normal leading-4 text-neutral-900",
    font: "Inter",
    size: "12 / 16",
    weight: "Regular",
    use: "Captions, meta",
  },
];

const SPACING_TOKENS = [
  { px: 4, rem: "(0.25rem)", radius: "rounded-[1px]" },
  { px: 8, rem: "(0.5rem)", radius: "rounded-[2px]" },
  { px: 12, rem: "(0.75rem)", radius: "rounded-[3px]" },
  { px: 16, rem: "(1rem)", radius: "rounded-[4px]" },
  { px: 24, rem: "(1.5rem)", radius: "rounded-[5px]" },
  { px: 32, rem: "(2rem)", radius: "rounded-[6px]" },
  { px: 40, rem: "(2.5rem)", radius: "rounded-[6px]" },
  { px: 48, rem: "(3rem)", radius: "rounded-[8px]" },
  { px: 64, rem: "(4rem)", radius: "rounded-[8px]" },
];

const RADIUS_TOKENS = [
  { label: "4px", sub: "(xs)", className: "rounded-xs" },
  { label: "8px", sub: "(sm)", className: "rounded-sm" },
  { label: "12px", sub: "(md)", className: "rounded-md" },
  { label: "16px", sub: "(lg)", className: "rounded-lg" },
  { label: "24px", sub: "(xl)", className: "rounded-xl" },
  { label: "Full", sub: "(circle)", className: "rounded-full" },
];

const SHADOW_TOKENS = [
  {
    name: "Sm",
    line1: "0 1px 2px 0",
    line2: "rgba(15, 23, 42, 0.05)",
    className: "shadow-sm",
  },
  {
    name: "Md",
    line1: "0 4px 12px -2px",
    line2: "rgba(15, 23, 42, 0.08)",
    className: "shadow-md",
  },
  {
    name: "Lg",
    line1: "0 12px 24px -4px",
    line2: "rgba(15, 23, 42, 0.10)",
    className: "shadow-lg",
  },
  {
    name: "Xl",
    line1: "0 20px 40px -8px",
    line2: "rgba(15, 23, 42, 0.12)",
    className: "shadow-xl",
  },
];

export function DesignSystemShowcase() {
  const [searchValue, setSearchValue] = useState("");
  const [sortOption, setSortOption] = useState("relevant");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-8">
      <main className="mx-auto max-w-1440px] space-y-5 px-4 sm:px-6 lg:px-8">
        {/* ROW 1: HERO + 01 COLORS */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <SurfaceCard className="flex flex-col justify-between lg:col-span-4">
            <div>
              <VertexLogo />
              <h1 className="mt-7 font-display text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-neutral-900 sm:text-[48px] sm:leading-[56px]">
                Design System
              </h1>
              <p className="mt-4 text-[16px] leading-[24px] text-neutral-500">
                A unified design language for Vertex learning platform. Clean,
                modern and focused on clarity, consistency and intuitive
                learning experiences.
              </p>
            </div>
            <div className="mt-10 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
              <span>VERSION 1.0</span>
              <span aria-hidden="true">•</span>
              <span>MAY 2025</span>
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-8">
            <SectionHeading number="01" title="COLORS" />

            <div className="mt-5">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Primary
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
                {PRIMARY_COLORS.map((color) => (
                  <div key={color.name}>
                    <div
                      className={`h-[56px] w-full rounded-[10px] ${color.className}`}
                    />
                    <p className="mt-2 text-[12px] font-medium text-neutral-900">
                      {color.name}
                    </p>
                    <p className="text-[11px] text-neutral-500">{color.hex}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Neutral
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {NEUTRAL_COLORS.map((color) => (
                  <div key={color.name}>
                    <div
                      className={`h-[52px] w-full rounded-[10px] ${color.className}`}
                    />
                    <p className="mt-2 text-[12px] font-medium text-neutral-900">
                      {color.name}
                    </p>
                    <p className="text-[11px] text-neutral-500">{color.hex}</p>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* ROW 2: 02 TYPOGRAPHY + 03 TYPE SCALE */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <SurfaceCard className="lg:col-span-5">
            <SectionHeading number="02" title="TYPOGRAPHY" />

            <div className="mt-7 space-y-8">
              <div className="flex items-center gap-6">
                <span className="w-[84px] shrink-0 font-display text-[52px] font-normal leading-none text-neutral-900">
                  Ag
                </span>
                <div>
                  <p className="text-[18px] font-medium leading-6 text-neutral-900">
                    Playfair Display
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-neutral-500">
                    <span>Elegant</span>
                    <span className="text-primary-500" aria-hidden="true">
                      •
                    </span>
                    <span>Readable</span>
                    <span className="text-primary-500" aria-hidden="true">
                      •
                    </span>
                    <span>Timeless</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="w-[84px] shrink-0 font-sans text-[52px] font-normal leading-none text-neutral-900">
                  Ag
                </span>
                <div>
                  <p className="text-[18px] font-medium leading-6 text-neutral-900">
                    Inter
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-neutral-500">
                    <span>Clean</span>
                    <span className="text-primary-500" aria-hidden="true">
                      •
                    </span>
                    <span>Modern</span>
                    <span className="text-primary-500" aria-hidden="true">
                      •
                    </span>
                    <span>Highly legible</span>
                  </p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-7">
            <SectionHeading number="03" title="TYPE SCALE" />

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-100 text-[12px] text-neutral-500">
                    <th className="pb-2.5 pr-4 font-normal">Style</th>
                    <th className="pb-2.5 pr-4 font-normal">Font</th>
                    <th className="pb-2.5 pr-4 font-normal">
                      Size / Line Height
                    </th>
                    <th className="pb-2.5 pr-4 font-normal">Weight</th>
                    <th className="pb-2.5 font-normal">Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100/80">
                  {TYPE_SCALE_ROWS.map((row) => (
                    <tr key={row.style}>
                      <td className="py-2 pr-4">
                        <span className={row.sampleClass}>{row.style}</span>
                      </td>
                      <td className="py-2 pr-4 text-[12px] text-neutral-500">
                        {row.font}
                      </td>
                      <td className="py-2 pr-4 text-[12px] text-neutral-500">
                        {row.size}
                      </td>
                      <td className="py-2 pr-4 text-[12px] text-neutral-500">
                        {row.weight}
                      </td>
                      <td className="py-2 text-[12px] text-neutral-500">
                        {row.use}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>

        {/* ROW 3: 04 SPACING SYSTEM + 05 RADIUS & SHADOWS */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <SurfaceCard className="lg:col-span-6">
            <SectionHeading number="04" title="SPACING SYSTEM" />
            <p className="mt-4 text-[13px] font-semibold text-neutral-900">
              Base unit: 4px
            </p>

            <div className="mt-10 flex flex-wrap items-end gap-4 sm:gap-5">
              {SPACING_TOKENS.map((space) => (
                <div
                  key={space.px}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`bg-[#FDE2D1] ${space.radius}`}
                    style={{ width: `${space.px}px`, height: `${space.px}px` }}
                  />
                  <span className="mt-3 text-[12px] font-medium text-neutral-900">
                    {space.px}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {space.rem}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-6">
            <SectionHeading number="05" title="RADIUS & SHADOWS" />

            <div className="mt-4">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Radius
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {RADIUS_TOKENS.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className={`h-14 w-14 border border-neutral-300 bg-white ${item.className}`}
                    />
                    <span className="mt-2.5 text-[12px] font-medium text-neutral-900">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {item.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Shadows
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SHADOW_TOKENS.map((shadow) => (
                  <div
                    key={shadow.name}
                    className={`rounded-md border border-neutral-100 bg-white p-3.5 ${shadow.className}`}
                  >
                    <p className="text-[13px] font-semibold text-neutral-900">
                      {shadow.name}
                    </p>
                    <p className="mt-1.5 text-[10px] leading-[14px] text-neutral-500">
                      {shadow.line1}
                      <br />
                      {shadow.line2}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* ROW 4: 06 ICONS + 07 BUTTONS + 08 INPUTS */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.55fr_0.95fr]">
          <SurfaceCard>
            <SectionHeading number="06" title="ICONS" />

            <div className="mt-4">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Outline Style
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-3.5 text-neutral-900">
                <BellIcon variant="outline" size={20} />
                <SearchIcon variant="outline" size={20} />
                <PlayCircleIcon variant="outline" size={20} />
                <DocumentIcon variant="outline" size={20} />
                <BookmarkIcon variant="outline" size={20} />
                <BarChartIcon variant="outline" size={20} />
                <ClockIcon variant="outline" size={20} />
                <UserIcon variant="outline" size={20} />
                <ChevronRightIcon variant="outline" size={20} />
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Filled Style
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-3.5 text-neutral-900">
                <BellIcon variant="filled" size={20} />
                <SearchIcon variant="filled" size={20} />
                <PlayCircleIcon variant="filled" size={20} />
                <DocumentIcon variant="filled" size={20} />
                <BookmarkIcon variant="filled" size={20} />
                <BarChartIcon variant="filled" size={20} />
                <ClockIcon variant="filled" size={20} />
                <UserIcon variant="filled" size={20} />
                <ChevronRightIcon variant="filled" size={20} />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Icon Specs
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] text-neutral-500">
                <li>24x24px grid</li>
                <li>2px stroke width (outline)</li>
                <li>Rounded line caps</li>
                <li>Consistent optical balance</li>
              </ul>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading number="07" title="BUTTONS" />

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[490px]">
                <div className="grid grid-cols-[64px_repeat(4,minmax(0,1fr))] items-center gap-2.5 text-[12px] text-neutral-500">
                  <span />
                  <span className="font-medium">Primary</span>
                  <span className="font-medium">Secondary</span>
                  <span className="font-medium">Tertiary</span>
                  <span className="font-medium">Text</span>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-[64px_repeat(4,minmax(0,1fr))] items-center gap-2.5">
                    <span className="text-[12px] text-neutral-500">
                      Default
                    </span>
                    <Button variant="primary" size="md" className="w-full">
                      Get Started
                    </Button>
                    <Button variant="secondary" size="md" className="w-full">
                      Explore Courses
                    </Button>
                    <Button
                      variant="tertiary"
                      size="md"
                      className="w-full"
                      rightIcon={<ExternalLinkIcon size={13} />}
                    >
                      View Lesson
                    </Button>
                    <Button
                      variant="text"
                      size="md"
                      className="w-full"
                      rightIcon={<PlayCircleIcon size={15} />}
                    >
                      Watch Video
                    </Button>
                  </div>

                  <div className="grid grid-cols-[64px_repeat(4,minmax(0,1fr))] items-center gap-2.5">
                    <span className="text-[12px] text-neutral-500">Hover</span>
                    <Button
                      variant="primary"
                      size="md"
                      forceHover
                      className="w-full"
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      forceHover
                      className="w-full"
                    >
                      Explore Courses
                    </Button>
                    <Button
                      variant="tertiary"
                      size="md"
                      forceHover
                      className="w-full"
                      rightIcon={<ExternalLinkIcon size={13} />}
                    >
                      View Lesson
                    </Button>
                    <Button
                      variant="text"
                      size="md"
                      forceHover
                      className="w-full"
                      rightIcon={<PlayCircleIcon size={15} />}
                    >
                      Watch Video
                    </Button>
                  </div>

                  <div className="grid grid-cols-[64px_repeat(4,minmax(0,1fr))] items-center gap-2.5">
                    <span className="text-[12px] text-neutral-500">
                      Disabled
                    </span>
                    <Button
                      variant="primary"
                      size="md"
                      disabled
                      className="w-full"
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      disabled
                      className="w-full"
                    >
                      Explore Courses
                    </Button>
                    <Button
                      variant="tertiary"
                      size="md"
                      disabled
                      className="w-full"
                      rightIcon={<ExternalLinkIcon size={13} />}
                    >
                      View Lesson
                    </Button>
                    <Button
                      variant="text"
                      size="md"
                      disabled
                      className="w-full"
                      rightIcon={<PlayCircleIcon size={15} />}
                    >
                      Watch Video
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Button Specs
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] text-neutral-500">
                <li>Height: 44px (default)</li>
                <li>Padding: 0 16px (lg), 0 12px (md)</li>
                <li>Radius: 12px</li>
                <li>Font: Inter Medium (14–16px)</li>
              </ul>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading number="08" title="INPUTS" />

            <div className="mt-4">
              <label
                htmlFor="ds-search-input"
                className="block text-[13px] font-semibold text-neutral-900"
              >
                Search / Text Input
              </label>
              <SearchInput
                id="ds-search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search anything..."
                shortcut="⌘ K"
                containerClassName="mt-2.5"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="ds-select-input"
                className="block text-[13px] font-semibold text-neutral-900"
              >
                Select
              </label>
              <SelectInput
                id="ds-select-input"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                options={[
                  { label: "Most Relevant", value: "relevant" },
                  { label: "Newest", value: "newest" },
                  { label: "Most Popular", value: "popular" },
                  { label: "Shortest Duration", value: "duration" },
                ]}
                containerClassName="mt-2.5"
              />
            </div>

            <div className="mt-5">
              <h3 className="text-[13px] font-semibold text-neutral-900">
                Field Specs
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] text-neutral-500">
                <li>Height: 44px</li>
                <li>Radius: 12px</li>
                <li>Border: 1px solid #E2E8F0</li>
                <li>Padding: 0 16px</li>
                <li>Focus: Border color #FB923C</li>
              </ul>
            </div>
          </SurfaceCard>
        </div>

        {/* ROW 5: 09 BADGES / TAGS + 10 STATUS / INDICATORS + 11 PROGRESS BAR */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.35fr_1.1fr]">
          <SurfaceCard>
            <SectionHeading number="09" title="BADGES / TAGS" />

            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="mb-2.5 text-[12px] text-neutral-500">Video</p>
                <Badge variant="video" />
              </div>
              <div>
                <p className="mb-2.5 text-[12px] text-neutral-500">Lesson</p>
                <Badge variant="lesson" />
              </div>
              <div>
                <p className="mb-2.5 text-[12px] text-neutral-500">Popular</p>
                <Badge variant="popular" />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading number="10" title="STATUS / INDICATORS" />

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <StatusIndicator status="in-progress" />
              <StatusIndicator status="completed" />
              <StatusIndicator status="now-playing" />
              <StatusIndicator status="locked" />
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading number="11" title="PROGRESS BAR" />

            <div className="mt-8">
              <ProgressBar value={35} />
            </div>
          </SurfaceCard>
        </div>

        {/* ROW 6: 12 CARDS */}
        <SurfaceCard>
          <SectionHeading number="12" title="CARDS" />

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col">
              <p className="mb-2.5 text-[12px] text-neutral-500">Course Card</p>
              <CourseCard
                badgeText="N"
                title="Next.js for Production"
                description="Build scalable, high-performance web applications with Next.js."
                level="Intermediate"
                duration="18h 24m"
                moduleCount="12 modules"
              />
            </div>

            <div className="flex flex-col">
              <p className="mb-2.5 text-[12px] text-neutral-500">
                Lesson Card (Video)
              </p>
              <LessonVideoCard
                title="Data Fetching in Server Components"
                description="Learn how to fetch data on the server using async/await and Next.js best practices."
                lessonMeta="Lesson 5.1 · 12:45"
                actionLabel="Watch from 12:45"
              />
            </div>

            <div className="flex flex-col">
              <p className="mb-2.5 text-[12px] text-neutral-500">
                Lesson Card (Lesson)
              </p>
              <LessonTopicCard
                title="Data Fetching & Caching"
                description="Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance."
                moduleMeta="Module 5"
                actionLabel="View lesson"
              />
            </div>

            <div className="flex flex-col">
              <p className="mb-2.5 text-[12px] text-neutral-500">
                Resource Card
              </p>
              <ResourceCard
                title="Caching and Revalidation Guide"
                description="Deep dive into Next.js caching strategies."
                fileMeta="PDF · 1.2 MB"
              />
            </div>
          </div>
        </SurfaceCard>

        {/* ROW 7: 13 NAVIGATION */}
        <SurfaceCard>
          <SectionHeading number="13" title="NAVIGATION" />

          <div className="mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <NavBar />
            </div>

            <div className="lg:col-span-5">
              <p className="mb-2 text-[12px] text-neutral-500">Breadcrumbs</p>
              <Breadcrumbs
                items={[
                  { label: "All Courses", href: "#" },
                  { label: "Next.js for Production", href: "#" },
                  { label: "Data Fetching & Caching" },
                ]}
              />
            </div>

            <div className="lg:col-span-3 lg:justify-self-end">
              <p className="mb-2 text-[12px] text-neutral-500">Pagination</p>
              <Pagination
                currentPage={currentPage}
                totalPages={8}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </SurfaceCard>

        {/* ROW 8: 14 PRINCIPLES */}
        <SurfaceCard>
          <SectionHeading number="14" title="PRINCIPLES" />

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3.5">
              <EyeIcon size={24} className="mt-0.5 shrink-0 text-neutral-500" />
              <div>
                <h3 className="text-[13px] font-semibold text-neutral-900">
                  Clarity First
                </h3>
                <p className="mt-1 text-[12px] leading-[18px] text-neutral-500">
                  Every element should communicate clearly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <GridIcon size={24} className="mt-0.5 shrink-0 text-neutral-500" />
              <div>
                <h3 className="text-[13px] font-semibold text-neutral-900">
                  Consistency
                </h3>
                <p className="mt-1 text-[12px] leading-[18px] text-neutral-500">
                  Use components and patterns consistently across the platform.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <TargetIcon
                size={24}
                className="mt-0.5 shrink-0 text-neutral-500"
              />
              <div>
                <h3 className="text-[13px] font-semibold text-neutral-900">
                  Focus &amp; Calm
                </h3>
                <p className="mt-1 text-[12px] leading-[18px] text-neutral-500">
                  Remove noise and help learners focus on what matters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <AccessibilityIcon
                size={24}
                className="mt-0.5 shrink-0 text-neutral-500"
              />
              <div>
                <h3 className="text-[13px] font-semibold text-neutral-900">
                  Accessible
                </h3>
                <p className="mt-1 text-[12px] leading-[18px] text-neutral-500">
                  Design with accessibility and inclusivity in mind.
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </main>
    </div>
  );
}
