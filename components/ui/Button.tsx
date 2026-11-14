import React from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "text";
export type ButtonSize = "md" | "lg" | "inline";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  forceHover?: boolean;
}

export function Button({
  variant = "primary",
  size = "lg",
  leftIcon,
  rightIcon,
  forceHover = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 whitespace-nowrap select-none";

  const sizeClasses: Record<ButtonSize, string> = {
    lg: "h-[44px] px-4 rounded-md text-[14px] leading-5",
    md: "h-[44px] px-3 rounded-md text-[14px] leading-5",
    inline: "h-auto px-0 py-0 rounded-xs text-[13px] leading-5",
  };

  const variantClasses: Record<
    ButtonVariant,
    { default: string; hover: string; forcedHover: string; disabled: string }
  > = {
    primary: {
      default: "bg-primary-500 text-white",
      hover: "hover:bg-[#DC570A] active:bg-[#C2410C] cursor-pointer",
      forcedHover: "bg-[#DC570A] text-white cursor-pointer",
      disabled: "bg-[#FDE2D1] text-primary-300 cursor-not-allowed",
    },
    secondary: {
      default: "bg-white text-primary-500 border border-primary-400",
      hover: "hover:bg-primary-100 active:bg-primary-200/60 cursor-pointer",
      forcedHover:
        "bg-primary-100 text-primary-500 border border-primary-400 cursor-pointer",
      disabled:
        "bg-white text-primary-300 border border-primary-200 cursor-not-allowed",
    },
    tertiary: {
      default: "bg-white text-neutral-900 border border-neutral-200",
      hover: "hover:bg-neutral-100 active:bg-neutral-200/70 cursor-pointer",
      forcedHover:
        "bg-neutral-100 text-neutral-900 border border-neutral-200 cursor-pointer",
      disabled:
        "bg-white text-neutral-300 border border-neutral-200 cursor-not-allowed",
    },
    text: {
      default: "bg-transparent text-primary-500",
      hover: "hover:text-[#DC570A] active:text-[#C2410C] cursor-pointer",
      forcedHover: "bg-transparent text-[#DC570A] cursor-pointer",
      disabled: "bg-transparent text-primary-300 cursor-not-allowed",
    },
  };

  const stateClass = disabled
    ? variantClasses[variant].disabled
    : forceHover
      ? variantClasses[variant].forcedHover
      : `${variantClasses[variant].default} ${variantClasses[variant].hover}`;

  const resolvedSize =
    variant === "text" && size === "lg" ? "h-[44px] px-1 rounded-md text-[14px] leading-5" : sizeClasses[size];

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${resolvedSize} ${stateClass} ${className}`}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
