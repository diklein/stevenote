"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useSlide } from "./context";
import { useStepSpan } from "./steps";

export type Chapter = { at: number; label?: ReactNode };

/**
 * Video as a slide type. Plays when the slide becomes active, pauses when it leaves, holds the last
 * frame by default. Chapters turn into build steps: each click seeks to the next chapter.
 * While it plays, the rest of the slide dims so the eye goes to the moving picture.
 * Previews in the notes window show the poster and never play.
 * With `controls`, a click pauses or resumes, a slim scrubber appears along the bottom edge, and
 * K pauses or plays, J and L step five seconds back and forward.
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
  controls = false,
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
  /** Pause, play and scrub: click the picture, drag the bar, or press K, J and L. */
  controls?: boolean;
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

  // Controls: current time, duration and whether the picture is moving, for the scrubber.
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hover, setHover] = useState(false);
  const scrubbing = useRef(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || !controls || preview) return;
    const onTime = () => setTime(v.currentTime);
    const onDuration = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    onDuration();
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("seeking", onTime);
    v.addEventListener("seeked", onTime);
    v.addEventListener("durationchange", onDuration);
    v.addEventListener("loadedmetadata", onDuration);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("seeking", onTime);
    v.removeEventListener("seeked", onTime);
      v.removeEventListener("durationchange", onDuration);
      v.removeEventListener("loadedmetadata", onDuration);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onPause);
    };
  }, [controls, preview]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => {});
    else v.pause();
  };
  const seekBy = (s: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + s), v.duration || Infinity);
  };

  // K pauses or plays, J and L scrub. None of these are deck keys, so the deck's handler ignores them.
  useEffect(() => {
    if (!controls || preview || !active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === "k") toggle();
      else if (key === "j") seekBy(-5);
      else if (key === "l") seekBy(5);
      else return;
      e.preventDefault();
    };
    // The same three actions arrive from the notes window over the deck's channel.
    const onRemote = (e: Event) => {
      const d = (e as CustomEvent<{ op: "toggle" | "seek"; by?: number }>).detail;
      if (d.op === "toggle") toggle();
      else if (d.op === "seek") seekBy(d.by ?? 0);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("stevenote:video", onRemote);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("stevenote:video", onRemote);
    };
  }, [controls, preview, active]);

  // timeupdate fires only a few times a second; while playing, read the clock every frame instead.
  useEffect(() => {
    const v = ref.current;
    if (!v || !controls || preview || !playing) return;
    let raf = 0;
    const tick = () => {
      setTime(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controls, preview, playing]);

  const seekToPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(Math.max(0, (e.clientX - r.left) / r.width), 1);
    v.currentTime = f * v.duration;
    setTime(v.currentTime);
  };
  const onTrackDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekToPointer(e);
  };
  const onTrackMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubbing.current) seekToPointer(e);
  };
  const onTrackUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    scrubbing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const showBar = controls && !preview && (hover || !playing);
  const videoStyle = { maxWidth: "100%", maxHeight: maxHeight ?? (title ? "calc(100cqh - 2 * var(--sn-pad) - var(--sn-lh-3) - var(--sn-base))" : "calc(100cqh - 2 * var(--sn-pad))"), borderRadius: "var(--sn-radius)", background: "black" } as const;

  return (
    <div ref={wrap} style={{ display: "flex", flexDirection: "column", gap: "var(--sn-base)", height: "100%" }}>
      {title && <h2 style={{ fontSize: "var(--sn-step-3)", lineHeight: "var(--sn-lh-3)" }}>{title}</h2>}
      <div data-focus-target style={{ position: "relative", flex: 1, minHeight: 0, display: "grid", placeItems: "center" }}>
        <div
          style={{ position: "relative", display: "grid", maxWidth: "100%", maxHeight: "100%", cursor: controls ? "pointer" : undefined }}
          onClick={controls ? toggle : undefined}
          onPointerEnter={controls ? () => setHover(true) : undefined}
          onPointerLeave={controls ? () => setHover(false) : undefined}
        >
          <video ref={ref} src={src} poster={poster} muted playsInline loop={loop} preload="auto" style={videoStyle} />
          {controls && !preview && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "1.2cqi",
                right: "1.2cqi",
                bottom: "1cqi",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: "1cqi",
                padding: "0.6cqi 1cqi",
                borderRadius: "0.6cqi",
                background: "oklch(10% 0 0 / 0.6)",
                backdropFilter: "blur(8px)",
                color: "white",
                opacity: showBar ? 1 : 0,
                transition: "opacity 200ms",
                cursor: "default",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                role="slider"
                aria-label="Position"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(time)}
                onPointerDown={onTrackDown}
                onPointerMove={onTrackMove}
                onPointerUp={onTrackUp}
                onPointerCancel={onTrackUp}
                style={{ position: "relative", height: "1.4cqi", display: "grid", alignItems: "center", cursor: "pointer", touchAction: "none" }}
              >
                <div style={{ height: "0.35cqi", borderRadius: "1cqi", background: "oklch(100% 0 0 / 0.25)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${duration ? (time / duration) * 100 : 0}%`, background: "white" }} />
                </div>
              </div>
              <span className="tabular" style={{ fontSize: "1.2cqi", lineHeight: 1, fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>
                {clock(time)} / {clock(duration)}
              </span>
            </div>
          )}
        </div>
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
