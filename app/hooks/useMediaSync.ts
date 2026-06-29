"use client";

import { type RefObject, useEffect } from "react";

interface UseMediaSyncParams {
  isPlaying: boolean;
  instrumentalUrl: string | undefined;
  sourceVideoUrl: string | null | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
}

export function useMediaSync({
  isPlaying,
  instrumentalUrl,
  sourceVideoUrl,
  videoRef,
  audioRef,
}: UseMediaSyncParams) {
  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;

    if (videoEl && instrumentalUrl) {
      videoEl.muted = true;
    }

    if (audioEl && instrumentalUrl) {
      if (isPlaying) {
        void audioEl.play();
        if (videoEl) void videoEl.play().catch(() => {});
      } else {
        audioEl.pause();
        if (videoEl) videoEl.pause();
      }
      return;
    }

    if (!videoEl || !sourceVideoUrl) return;
    videoEl.muted = false;
    if (isPlaying) {
      void videoEl.play();
    } else {
      videoEl.pause();
    }
  }, [isPlaying, sourceVideoUrl, instrumentalUrl, videoRef, audioRef]);
}
