import Link from "next/link";
import { VertexLogo } from "@/components/icons/VertexIcons";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-6 text-center">
      <VertexLogo />
      <p className="max-w-md text-[15px] leading-6 text-neutral-500">
        The Vertex course catalog is coming soon.
      </p>
      <Link
        href="/design-system"
        className="inline-flex h-[44px] items-center justify-center rounded-md bg-primary-500 px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#DC570A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
      >
        View the design system
      </Link>
    </main>
  );
}
