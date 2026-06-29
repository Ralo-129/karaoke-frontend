"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

export function useLyricsScroll(activeLyricIndex: number) {
  const [containerOffset, setContainerOffset] = useState(0);
  const lyricRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (activeLyricIndex < 0) {
      setContainerOffset(0);
      return;
    }

    const containerEl = document.getElementById("lyrics-container");
    const activeEl = lyricRefs.current[activeLyricIndex];

    if (containerEl && activeEl) {
      const containerHeight = containerEl.offsetHeight;
      const activeHeight = activeEl.offsetHeight;
      const activeTop = activeEl.offsetTop;
      const targetOffset = containerHeight / 2 - (activeTop + activeHeight / 2);
      setContainerOffset(targetOffset);
    }
  }, [activeLyricIndex]);

  const setLyricRef = (index: number) => (el: HTMLDivElement | null) => {
    lyricRefs.current[index] = el;
  };

  return { containerOffset, lyricRefs, setLyricRef };
}
