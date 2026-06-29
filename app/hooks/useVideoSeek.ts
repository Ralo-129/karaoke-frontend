"use client";

import { type RefObject } from "react";

interface UseVideoSeekParams {
  videoRef: RefObject<HTMLVideoElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  duration: number;
  pendingSeekRef: RefObject<number | null>;
  setCurrentTime: (t: number) => void;
}

export function useVideoSeek({
  videoRef,
  audioRef,
  duration,
  pendingSeekRef,
  setCurrentTime,
}: UseVideoSeekParams) {
  const handleSeek = (offset: number) => {
    const audioEl = audioRef.current;
    const videoEl = videoRef.current;
    const media = audioEl ?? videoEl;
    if (!media) return;

    const canSeekNow = Number.isFinite(media.duration) && media.duration > 0;
    const mediaDuration = canSeekNow ? media.duration : duration;
    const next = Math.max(
      0,
      Math.min(
        (media.currentTime || 0) + offset,
        mediaDuration || (media.currentTime || 0) + offset
      )
    );

    if (!canSeekNow && (media.readyState ?? 0) < 1) {
      pendingSeekRef.current = next;
      return;
    }

    try {
      if (audioEl) audioEl.currentTime = next;
    } catch (e) {
      // ignore
    }

    try {
      if (videoEl) videoEl.currentTime = next;
    } catch (e) {
      // ignore
    }

    setCurrentTime(next);
  };

  return { handleSeek };
}
