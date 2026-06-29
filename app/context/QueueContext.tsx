"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Song } from "../data/songs";

interface QueueContextValue {
  queue: Song[];
  addToQueue: (song: Song) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  shiftQueue: () => Song | null;
}

const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Song[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = sessionStorage.getItem("karaoke-queue");
      return stored ? (JSON.parse(stored) as Song[]) : [];
    } catch {
      return [];
    }
  });

  const persist = (next: Song[]) => {
    setQueue(next);
    try { sessionStorage.setItem("karaoke-queue", JSON.stringify(next)); } catch { /* ignore */ }
  };

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      if (prev.some((s) => s.id === song.id)) return prev;
      const next = [...prev, song];
      try { sessionStorage.setItem("karaoke-queue", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try { sessionStorage.setItem("karaoke-queue", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    persist([]);
  }, []);

  const shiftQueue = useCallback((): Song | null => {
    let next: Song | null = null;
    setQueue((prev) => {
      if (!prev.length) return prev;
      [next] = prev;
      const remaining = prev.slice(1);
      try { sessionStorage.setItem("karaoke-queue", JSON.stringify(remaining)); } catch { /* ignore */ }
      return remaining;
    });
    return next;
  }, []);

  return (
    <QueueContext.Provider value={{ queue, addToQueue, removeFromQueue, clearQueue, shiftQueue }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue debe usarse dentro de QueueProvider");
  return ctx;
}
