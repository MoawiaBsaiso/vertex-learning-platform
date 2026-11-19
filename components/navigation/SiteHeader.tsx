import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

import { BellIcon, VertexLogo } from "@/components/icons/VertexIcons";

export interface SiteHeaderProps {
  coursesHref?: string;
  coursesActive?: boolean;
  font?: "sans" | "serif";
}

export function SiteHeader({
  coursesHref = "/courses",
  coursesActive = false,
  font = "sans",
}: SiteHeaderProps) {
  const serif = font === "serif";

  return (
    <header className="relative z-10 border-b border-[#EEE1DA]">
      <div
        className={`mx-auto flex w-full max-w-[1024px] flex-wrap items-center gap-y-3 px-5 py-4 sm:flex-nowrap sm:py-0 ${
          serif
            ? "min-h-[88px] sm:px-16"
            : "min-h-[98px] sm:px-[42px]"
        }`}
      >
        <Link
          href="/"
          aria-label="Vertex home"
          className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4"
        >
          <VertexLogo className="gap-2.5 [&>span]:text-[24px] [&>svg]:h-[34px] [&>svg]:w-[36px]" />
        </Link>

        <nav
          aria-label="Primary navigation"
          className={`order-3 flex w-full items-center text-[#111111] sm:order-none sm:w-auto ${
            serif
              ? "gap-[52px] sm:ml-[34px] sm:gap-[70px]"
              : "gap-8 sm:ml-[62px] sm:gap-[43px]"
          }`}
        >
          <Link
            href={coursesHref}
            aria-current={coursesActive ? "page" : undefined}
            className={`rounded-xs transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4 ${
              serif ? "font-display text-[17px]" : "text-[15px]"
            }`}
          >
            Courses
          </Link>
          <Link
            href="/my-learning"
            className={`rounded-xs transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-4 ${
              serif ? "font-display text-[17px]" : "text-[15px]"
            }`}
          >
            My Learning
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-[18px] sm:gap-[21px]">
          <button
            type="button"
            aria-label="Open notifications"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#30343B] transition-colors hover:bg-[#FFF3EC] hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <BellIcon size={25} />
          </button>
          <Suspense fallback={<div className="h-[53px] w-[53px]" />}>
            <Show when="signed-out">
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="cursor-pointer rounded-sm px-3 py-2 text-[15px] font-medium text-[#111111] transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="cursor-pointer rounded-sm bg-primary-500 px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                  >
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: { avatarBox: "vertexUserAvatar" },
                }}
              />
            </Show>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
