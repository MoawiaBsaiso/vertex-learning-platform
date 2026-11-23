"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { buildVideoEmbed } from "./videoEmbed";

export interface LessonVideoProps {
  videoUrl: string | null;
  duration: number | null;
  thumbnailSrc: string | null;
  title: string;
}

function readStart(searchParams: URLSearchParams, duration: number | null) {
  const raw = searchParams.get("start");

  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  if (duration !== null && duration > 0 && parsed >= duration) {
    return null;
  }

  return parsed;
}

function VideoFrame({
  videoUrl,
  duration,
  thumbnailSrc,
  title,
}: LessonVideoProps) {
  const searchParams = useSearchParams();
  const start = readStart(searchParams, duration);
  const src = videoUrl ? buildVideoEmbed(videoUrl, start) : null;

  if (!src) {
    if (thumbnailSrc) {
      return (
        <Image
          src={thumbnailSrc}
          alt={`${title} video thumbnail`}
          fill
          sizes="(min-width: 1024px) 610px, 100vw"
          className="object-cover"
        />
      );
    }

    return null;
  }

  return (
    <iframe
      src={src}
      title={`${title} video`}
      className="absolute inset-0 h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

export function LessonVideo(props: LessonVideoProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <Suspense fallback={null}>
        <VideoFrame {...props} />
      </Suspense>
    </div>
  );
}
