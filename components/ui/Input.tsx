"use client";

import React from "react";
import { ChevronDownIcon, SearchIcon } from "@/components/icons/VertexIcons";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  shortcut?: string;
  containerClassName?: string;
}

export function SearchInput({
  shortcut,
  containerClassName = "",
  className = "",
  placeholder = "Search anything...",
  ...props
}: SearchInputProps) {
  return (
    <div
      className={`group flex h-[44px] w-full items-center gap-2.5 rounded-md border border-neutral-200 bg-white px-4 transition-colors duration-150 focus-within:border-primary-400 ${containerClassName}`}
    >
      <SearchIcon
        size={18}
        className="shrink-0 text-neutral-500 transition-colors group-focus-within:text-primary-500"
      />
      <input
        type="search"
        placeholder={placeholder}
        className={`h-full w-full min-w-0 bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none ${className}`}
        {...props}
      />
      {shortcut && (
        <kbd className="inline-flex shrink-0 items-center rounded-[6px] border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-sans text-[11px] font-medium text-neutral-500">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectInputProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  containerClassName?: string;
}

export function SelectInput({
  options,
  containerClassName = "",
  className = "",
  ...props
}: SelectInputProps) {
  return (
    <div className={`relative w-full ${containerClassName}`}>
      <select
        className={`h-[44px] w-full appearance-none rounded-md border border-neutral-200 bg-white px-4 pr-10 text-[14px] font-medium text-neutral-900 transition-colors duration-150 hover:border-neutral-300 focus:border-primary-400 focus:outline-none cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-700"
      />
    </div>
  );
}
