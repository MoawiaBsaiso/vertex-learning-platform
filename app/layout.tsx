import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { PostHogProvider } from "@/components/analytics/PostHogProvider";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vertex",
  description:
    "An intelligent learning platform for finding the exact lessons you need.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-50 text-neutral-900 font-sans flex flex-col">
        <ClerkProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
