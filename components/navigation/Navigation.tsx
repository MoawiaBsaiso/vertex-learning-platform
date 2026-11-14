"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  VertexLogo,
} from "@/components/icons/VertexIcons";

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavBarProps {
  items?: NavItem[];
  className?: string;
}

export function NavBar({
  items = [
    { label: "Courses", href: "#", active: true },
    { label: "My Learning", href: "#", active: false },
  ],
  className = "",
}: NavBarProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className={`flex items-center gap-8 ${className}`}
    >
      <Link
        href="/"
        className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
      >
        <VertexLogo />
      </Link>
      <div className="flex items-center gap-6">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`text-[14px] font-medium transition-colors ${
              item.active
                ? "text-primary-500"
                : "text-neutral-900 hover:text-primary-500"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-[13px] leading-5 text-neutral-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-2">
              {idx > 0 && (
                <ChevronRightIcon size={14} className="text-neutral-300 shrink-0" />
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-neutral-700" : "text-neutral-500"}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const buildPages = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, "ellipsis", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "ellipsis", currentPage, "ellipsis", totalPages];
  };

  const pages = buildPages();

  return (
    <nav aria-label="Pagination" className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeftIcon size={15} />
      </button>

      {pages.map((item, idx) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex h-8 w-8 items-center justify-center text-[13px] text-neutral-500 select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange?.(item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-sm text-[13px] font-medium transition-colors cursor-pointer ${
              item === currentPage
                ? "border border-primary-300 bg-primary-100/70 text-primary-500"
                : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronRightIcon size={15} />
      </button>
    </nav>
  );
}
