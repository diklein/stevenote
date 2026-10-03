"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSlide } from "./context";
import { useStepSpan } from "./steps";

export type Chapter = { at: number; label?: ReactNode };

/**
 * Video as a slide type. Plays when the slide becomes active, pauses when it leaves, holds the last
 * frame by default. Chapters turn into build steps: each click seeks to the next chapter.
 * While it plays, the rest of the slide dims so the eye goes to the moving picture.
 * Previews in the notes window show the poster and never play.
 */
export function Video({
  src,
  poster,
  chapters = [],
  loop = false,
  rate = 1,
  title,
  showChapter = true,
  restartOnEnter = true,
  dimWhilePlaying = true,
  maxHeight,
}: {
  src: string;
  poster?: string;
  chapters?: Chapter[];
  loop?: boolean;
  rate?: number;
  title?: ReactNode;
  showChapter?: boolean;
  restartOnEnter?: boolean;
  dimWhilePlaying?: boolean;
  /** Overrides the default cap (the slide height) when the video shares the slide with other content. */
  maxHeight?: string;
}) {
  const { active, preview, setFocus } = useSlide();
  const ref = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  // Chapter 0 at time 0 is the slide's own first state; later chapters are clicks.
  const clickChapters = chapters.filter((c, i) => !(i === 0 && c.at === 0));
  const { local } = useStepSpan(clickChapters.length, undefined, wrap);
  const chapter = local > 0 ? clickChapters[local - 1] : chapters[0] && chapters[0].at === 0 ? chapters[0] : undefined;

  useEffect(() => {
    const v = ref.current;
    if (!v || preview) return;
    v.playbackRate = rate;
    if (active) {
      if (restartOnEnter && local === 0) v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active, preview, rate, restartOnEnter, local]);

  useEffect(() => {
    const v = ref.current;
    if (!v || preview || !active) return;
    if (local > 0) {
      v.currentTime = clickChapters[local - 1].at;
      v.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, active, preview]);

  // Focus: dim the rest of the slide while the video is actually playing.
  useEffect(() => {
    const v = ref.current;
    if (!v || preview || !dimWhilePlaying) return;
    const on = () => setFocus(true);
    const off = () => setFocus(false);
    v.addEventListener("playing", on);
    v.addEventListener("pause", off);
    v.addEventListener("ended", off);
    return () => {
      v.removeEventListener("playing", on);
      v.removeEventListener("pause", off);
      v.removeEventListener("ended", off);
      setFocus(false);
    };
  }, [preview, dimWhilePlaying, setFocus]);

  return (
    <div ref={wrap} style={{ display: "flex", flexDirection: "column", gap: "var(--sn-base)", height: "100%" }}>
      {title && <h2 style={{ fontSize: "var(--sn-step-3)", lineHeight: "var(--sn-lh-3)" }}>{title}</h2>}
      <div data-focus-target style={{ position: "relative", flex: 1, minHeight: 0, display: "grid", placeItems: "center" }}>
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          playsInline
          loop={loop}
          preload="auto"
          style={{ maxWidth: "100%", maxHeight: maxHeight ?? (title ? "calc(100cqh - 2 * var(--sn-pad) - var(--sn-lh-3) - var(--sn-base))" : "calc(100cqh - 2 * var(--sn-pad))"), borderRadius: "var(--sn-radius)", background: "black" }}
        />
        {showChapter && chapter?.label && (
          <div
            key={String(local)}
            data-step="active"
            style={{
              position: "absolute",
              left: "2cqi",
              bottom: "2cqi",
              padding: "0.8cqi 1.4cqi",
              borderRadius: "0.6cqi",
              background: "oklch(10% 0 0 / 0.75)",
              color: "white",
              fontSize: "var(--sn-step-1)",
              backdropFilter: "blur(8px)",
            }}
          >
            {chapter.label}
          </div>
        )}
      </div>
    </div>
  );
}
