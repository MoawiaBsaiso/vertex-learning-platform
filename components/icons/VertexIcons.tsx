import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  variant?: "outline" | "filled";
  size?: number;
}

export function VertexLogo({
  className = "",
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="28"
        height="26"
        viewBox="0 0 28 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2.15 2.5C1.38 1.17 2.34 -0.5 3.88 -0.5H24.12C25.66 -0.5 26.62 1.17 25.85 2.5L15.73 20.03C14.96 21.36 13.04 21.36 12.27 20.03L2.15 2.5Z"
          transform="translate(0 2)"
          fill="#F97316"
        />
        <path
          d="M9.6 5.5H18.4L14 13.3L9.6 5.5Z"
          fill="#FFFFFF"
        />
      </svg>
      {showWordmark && (
        <span className="font-sans text-[20px] font-bold tracking-[-0.02em] text-neutral-900">
          Vertex
        </span>
      )}
    </span>
  );
}

export function BellIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path
          d="M12 2.75C8.548 2.75 5.75 5.548 5.75 9V12.586C5.75 13.216 5.5 13.82 5.054 14.265L3.854 15.465C3.224 16.095 3.67 17.172 4.561 17.172H19.439C20.33 17.172 20.776 16.095 20.146 15.465L18.946 14.265C18.5 13.82 18.25 13.216 18.25 12.586V9C18.25 5.548 15.452 2.75 12 2.75Z"
          fill="currentColor"
        />
        <path
          d="M9.75 18.75C9.75 19.993 10.757 21 12 21C13.243 21 14.25 19.993 14.25 18.75H9.75Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function SearchIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <circle cx="11" cy="11" r="7.5" fill="currentColor" />
        <circle cx="11" cy="11" r="4" fill="#FFFFFF" />
        <path
          d="M16.5 16.5L21 21"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function PlayCircleIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <circle cx="12" cy="12" r="9.5" fill="currentColor" />
        <path
          d="M10 8.8C10 8.27 10.59 7.95 11.03 8.24L15.7 11.44C16.08 11.7 16.08 12.3 15.7 12.56L11.03 15.76C10.59 16.05 10 15.73 10 15.2V8.8Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <polygon points="10 8.5 16 12 10 15.5 10 8.5" />
    </svg>
  );
}

export function DocumentIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path
          d="M6.5 3C5.395 3 4.5 3.895 4.5 5V19C4.5 20.105 5.395 21 6.5 21H17.5C18.605 21 19.5 20.105 19.5 19V8.414C19.5 7.884 19.289 7.375 18.914 7L15.5 3.586C15.125 3.211 14.616 3 14.086 3H6.5Z"
          fill="currentColor"
        />
        <path
          d="M8.5 12H15.5M8.5 15.5H13.5"
          stroke="#FFFFFF"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

export function BookmarkIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path
          d="M6.5 3.5C5.672 3.5 5 4.172 5 5V20.2C5 20.665 5.515 20.945 5.905 20.692L12 16.75L18.095 20.692C18.485 20.945 19 20.665 19 20.2V5C19 4.172 18.328 3.5 17.5 3.5H6.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16.5l-6-4-6 4V4z" />
    </svg>
  );
}

export function BarChartIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <rect x="4" y="13" width="3.5" height="7" rx="1" fill="currentColor" />
        <rect x="10.25" y="9" width="3.5" height="11" rx="1" fill="currentColor" />
        <rect x="16.5" y="4.5" width="3.5" height="15.5" rx="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M5 20v-6" />
      <path d="M12 20V10" />
      <path d="M19 20V4" />
    </svg>
  );
}

export function ClockIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <circle cx="12" cy="12" r="9.5" fill="currentColor" />
        <path
          d="M12 7.5V12L15 13.75"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function UserIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <circle cx="12" cy="7.5" r="4" fill="currentColor" />
        <path
          d="M4.5 19.5C4.5 15.91 7.858 13.5 12 13.5C16.142 13.5 19.5 15.91 19.5 19.5C19.5 20.052 19.052 20.5 18.5 20.5H5.5C4.948 20.5 4.5 20.052 4.5 19.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function ChevronRightIcon({
  variant = "outline",
  size = 22,
  className = "",
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={variant === "filled" ? 2.75 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({
  size = 18,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon({
  size = 18,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ExternalLinkIcon({
  size = 16,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function FolderIcon({
  size = 16,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

export function InProgressIcon({
  size = 18,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="#FED7AA" strokeWidth={2.2} />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="#F97316"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({
  size = 18,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function LockIcon({
  size = 18,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function EyeIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function GridIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function TargetIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      <path d="m18.5 5.5-5 5" />
    </svg>
  );
}

export function AccessibilityIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
      <path d="M7.5 10.5h9" />
      <path d="M12 10.5v3.5" />
      <path d="m9.5 18 2.5-4 2.5 4" />
    </svg>
  );
}

export function ArrowRightIcon({
  size = 20,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function UsersIcon({
  size = 22,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function CodeIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 5-3 14" />
    </svg>
  );
}

export function LayersIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
      <path d="m3 12 9 4.5L21 12" />
      <path d="m3 16.5 9 4.5 9-4.5" />
    </svg>
  );
}

export function DatabaseIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="12" cy="6" rx="7.5" ry="3.5" />
      <path d="M4.5 6v12c0 1.93 3.36 3.5 7.5 3.5s7.5-1.57 7.5-3.5V6" />
      <path d="M4.5 12c0 1.93 3.36 3.5 7.5 3.5s7.5-1.57 7.5-3.5" />
    </svg>
  );
}

export function ShieldIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function RocketIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function TerminalIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </svg>
  );
}

export function BookIcon({
  size = 24,
  className = "",
  ...props
}: Omit<IconProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
