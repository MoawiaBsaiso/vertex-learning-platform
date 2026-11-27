import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SearchExperience } from "@/components/search/SearchExperience";

import "../home.css";

export const metadata: Metadata = {
  title: "Search | Vertex",
  description:
    "Search courses and lessons in plain English and jump to the exact topic you need.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function SearchPageFallback() {
  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-16 sm:px-10">
      <div className="h-5 w-32 animate-pulse rounded bg-primary-100" />
      <div className="mt-5 h-14 w-full max-w-[520px] animate-pulse rounded bg-white/75" />
      <div className="mt-8 h-[52px] w-full animate-pulse rounded-md bg-white/75" />
    </div>
  );
}

async function SearchPageContent({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return <SearchExperience key={query} query={query} />;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="vertexHomeCanvas">
      <div className="vertexHomeFrame">
        <SiteHeader />
        <main>
          <Suspense fallback={<SearchPageFallback />}>
            <SearchPageContent searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
