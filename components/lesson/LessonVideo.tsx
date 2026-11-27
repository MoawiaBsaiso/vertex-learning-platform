"use client";

import Image from "next/image";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";

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

const VideoFrame = /* #__PURE__ */ forwardRef<HTMLIFrameElement, LessonVideoProps>(
  (
    { videoUrl, duration, thumbnailSrc, title },
    ref,
  ) => {
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
        ref={ref}
        src={src}
        title={`${title} video`}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  },
);
VideoFrame.displayName = "VideoFrame";
export { VideoFrame };

const WATCH_DEPTH_MILESTONES = [25, 50, 75, 100];

export function LessonVideo(props: LessonVideoProps) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { videoUrl, duration, thumbnailSrc, title } = props;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const videoRef = useRef<HTMLIFrameElement>(null);
  const [watchedMilestones, setWatchedMilestones] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!videoUrl || !videoRef.current) {
      return;
    }

    const iframe = videoRef.current;
    let lastNotifiedPercentage = 0;

    const handleTimeUpdate = () => {
      if (!duration || duration <= 0) {
        return;
      }

try {
        const window = iframe?.contentWindow;
        let currentTime: number | undefined;
        if (window && typeof window === "object" && "getCurrentTime" in window) {
          currentTime = (window as { getCurrentTime: () => number }).getCurrentTime();
        }

        if (typeof currentTime === "number" && !Number.isNaN(currentTime) && iframe) {
          const percentage = Math.min(
            Math.floor((currentTime / duration) * 100 / 25) * 25,
            100,
          );

          if (percentage > lastNotifiedPercentage) {
            const milestones = WATCH_DEPTH_MILESTONES.filter(
              (m) => m <= percentage && !watchedMilestones.has(m),
            );

            milestones.forEach((milestone) => {
              posthog.capture("video_watch_depth", {
                video_url: videoUrl,
                start_seconds: 0,
                percentage: milestone,
                current_time: Math.round(currentTime),
                video_duration: duration,
                title,
              });
            });

            lastNotifiedPercentage = percentage;
            setWatchedMilestones(
              prev => new Set([...prev, ...milestones]),
            );
          }
        }
      } catch {
        /* access control - ignore */
      }
    };

    iframe.addEventListener("timeupdate", handleTimeUpdate);
    return () => iframe.removeEventListener("timeupdate", handleTimeUpdate);
  }, [videoUrl, duration, title, watchedMilestones]);

  useEffect(() => {
    if (!videoUrl) {
      return;
    }

    const iframe = videoRef.current;
    const onLoad = () => {
      posthog.capture("video_play", {
        video_url: videoUrl,
        title,
        start_seconds: 0,
        video_duration: duration,
      });

      // Track resume_used when video starts from a specific second > 0,
      // indicating the user is continuing from a previous position.
      // The start seconds are embedded in the video URL by the embed builder.
      try {
        const src = (iframe ?? videoRef.current)?.getAttribute("src") || "";
        const startMatch = src.match(/[?&]start=(\d+)/);
        const startSeconds = startMatch ? Number.parseInt(startMatch[1], 10) : 0;

        if (duration && duration > 0 && startSeconds > 0) {
          posthog.capture("resume_used", {
            lesson_id: "",
            start_seconds: startSeconds,
            title,
            video_duration: duration,
            was_resume: true,
          });
        }
      } catch {
        /* access control - ignore */
      }
    };

    if (iframe && iframe.addEventListener) {
      iframe.addEventListener("load", onLoad);
    }

    return () => {
      if (iframe && iframe.removeEventListener) {
        iframe.removeEventListener("load", onLoad);
      }
    };
  }, [videoUrl, title, duration]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <Suspense fallback={null}>
        <VideoFrame
          ref={videoRef}
          {...props}
        />
      </Suspense>
    </div>
  );
}
