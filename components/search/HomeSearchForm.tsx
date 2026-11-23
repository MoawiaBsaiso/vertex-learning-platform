"use client";

import posthog from "posthog-js";
import { useRef } from "react";

import { SearchIcon } from "@/components/icons/VertexIcons";

export function HomeSearchForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const query = inputRef.current?.value.trim();

    if (query) {
      posthog.capture("search_submitted", { query });
    }
  }

  return (
    <form
      action="/search"
      method="get"
      role="search"
      onSubmit={handleSubmit}
      className="mt-[42px] flex h-[72px] w-full max-w-[746px] items-center gap-3 rounded-md border border-[#EBDDD5] bg-white/80 px-4 shadow-[0_14px_36px_rgba(120,74,47,0.08),0_2px_5px_rgba(120,74,47,0.04)] transition-colors focus-within:border-primary-400 sm:h-[86px] sm:gap-[18px] sm:px-[23px]"
    >
      <label htmlFor="home-search" className="sr-only">
        Search your learning
      </label>
      <button
        type="submit"
        aria-label="Submit search"
        className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#363B43] transition-colors hover:bg-primary-100 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <SearchIcon size={29} />
      </button>
      <input
        ref={inputRef}
        id="home-search"
        name="q"
        type="search"
        required
        minLength={2}
        maxLength={200}
        placeholder="Ask anything about your learning..."
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-neutral-900 outline-none placeholder:text-[#949AAA] sm:text-[20px]"
      />
      <kbd className="inline-flex h-11 shrink-0 items-center rounded-sm border border-[#E7D9D1] bg-[#FFFCFA] px-[14px] font-sans text-[16px] text-[#454750] shadow-sm">
        ⌘ K
      </kbd>
    </form>
  );
}
