import React from "react";

export interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  labelSuffix?: string;
  className?: string;
}

export function ProgressBar({
  value,
  showLabel = true,
  labelSuffix = "complete",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={`flex w-full items-center gap-4 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped}% ${labelSuffix}`}
        className="h-2 w-full flex-1 overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-[13px] leading-5 text-neutral-500">
          <strong className="font-semibold text-neutral-900">{clamped}%</strong>{" "}
          {labelSuffix}
        </span>
      )}
    </div>
  );
}
