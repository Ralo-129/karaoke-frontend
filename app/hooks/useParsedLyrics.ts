"use client";

import { useMemo } from "react";
import { parseLrc, type LrcLine } from "../lib/lrc";

export function useParsedLyrics(
  lrc: string | undefined,
  currentTime: number
): { lyrics: LrcLine[]; activeLyricIndex: number } {
  const lyrics = useMemo(() => parseLrc(lrc ?? ""), [lrc]);

  const activeLyricIndex = useMemo(() => {
    if (!lyrics.length) return -1;
    let currentIndex = 0;
    for (let index = 0; index < lyrics.length; index++) {
      if (lyrics[index].time <= currentTime) {
        currentIndex = index;
      } else {
        break;
      }
    }
    return currentIndex;
  }, [currentTime, lyrics]);

  return { lyrics, activeLyricIndex };
}
