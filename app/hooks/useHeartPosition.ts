"use client";

import { useEffect, useState } from "react";
import { type LrcLine } from "../lib/lrc";

interface HeartPos {
  x: number;
  y: number;
  opacity: number;
}

export function useHeartPosition(
  currentTime: number,
  activeLyricIndex: number,
  lyrics: LrcLine[]
) {
  const [heartPos, setHeartPos] = useState<HeartPos>({ x: 0, y: 0, opacity: 0 });

  useEffect(() => {
    const activeLine = lyrics[activeLyricIndex];
    if (!activeLine) {
      setHeartPos((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const activeWordIndex = activeLine.words.findIndex(
      (w) => currentTime >= w.startTime && currentTime <= w.endTime
    );

    if (activeWordIndex === -1) return;

    const wordEl = document.getElementById(`word-${activeLyricIndex}-${activeWordIndex}`);
    const containerEl = document.getElementById("lyrics-container");

    if (wordEl && containerEl) {
      const wordRect = wordEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setHeartPos({
        x: wordRect.left - containerRect.left + wordRect.width / 2 + containerEl.scrollLeft,
        y: wordRect.top - containerRect.top - 5 + containerEl.scrollTop,
        opacity: 1,
      });
    } else {
      setHeartPos((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [currentTime, activeLyricIndex, lyrics]);

  return { heartPos };
}
