import React from "react";
import {
  CheckCircleIcon,
  InProgressIcon,
  LockIcon,
  PlayCircleIcon,
} from "@/components/icons/VertexIcons";

export type BadgeVariant = "video" | "lesson" | "popular";

export interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

const BADGE_STYLES: Record<BadgeVariant, { classes: string; defaultLabel: string }> =
  {
    video: {
      classes: "bg-primary-100 text-primary-500 border border-transparent",
      defaultLabel: "VIDEO",
    },
    lesson: {
      classes: "bg-lesson-bg text-lesson-text border border-transparent",
      defaultLabel: "LESSON",
    },
    popular: {
      classes: "bg-white text-primary-500 border border-primary-300",
      defaultLabel: "POPULAR",
    },
  };

export function Badge({ variant, children, className = "" }: BadgeProps) {
  const { classes, defaultLabel } = BADGE_STYLES[variant];
  return (
    <span
      className={`inline-flex items-center rounded-[6px] px-2.5 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.06em] leading-none ${classes} ${className}`}
    >
      {children ?? defaultLabel}
    </span>
  );
}

export type StatusType =
  | "in-progress"
  | "completed"
  | "now-playing"
  | "locked";

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  className = "",
}: StatusIndicatorProps) {
  switch (status) {
    case "in-progress":
      return (
        <span
          className={`inline-flex items-center gap-2 text-[13px] font-medium text-neutral-700 ${className}`}
        >
          <InProgressIcon size={18} />
          <span>{label ?? "In Progress"}</span>
        </span>
      );
    case "completed":
      return (
        <span
          className={`inline-flex items-center gap-2 text-[13px] font-medium text-neutral-700 ${className}`}
        >
          <CheckCircleIcon size={18} className="text-success-600" />
          <span>{label ?? "Completed"}</span>
        </span>
      );
    case "now-playing":
      return (
        <span
          className={`inline-flex items-center gap-2 text-[13px] font-medium text-neutral-700 ${className}`}
        >
          <PlayCircleIcon
            variant="filled"
            size={18}
            className="text-primary-500"
          />
          <span>{label ?? "Now Playing"}</span>
        </span>
      );
    case "locked":
      return (
        <span
          className={`inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 ${className}`}
        >
          <LockIcon size={17} className="text-neutral-500" />
          <span>{label ?? "Locked"}</span>
        </span>
      );
  }
}
