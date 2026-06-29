"use client";

import { useEffect, useRef, useState } from "react";
import { type Song } from "../data/songs";
import { POLL_INTERVAL_MS } from "../lib/constants";

export function useSongData(songId: string | undefined) {
  const [song, setSong] = useState<Song | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(Boolean(songId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<{
    status: string;
    progress: number;
    message: string;
  } | null>(null);
  const [isSeparatingOnDemand, setIsSeparatingOnDemand] = useState(false);
  const pendingSeekRef = useRef<number | null>(null);

  useEffect(() => {
    if (!songId) return;

    pendingSeekRef.current = null;
    const controller = new AbortController();

    const loadSong = async () => {
      try {
        const response = await fetch(`/api/catalog/${songId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          if (!controller.signal.aborted) {
            setLoadError(
              response.status === 404
                ? "No se encontró la canción. Es posible que haya sido eliminada."
                : "No se pudo cargar la canción. Intenta de nuevo más tarde."
            );
            setIsLoadingSong(false);
            setSong(null);
          }
          return;
        }

        const payload = (await response.json()) as Song;
        if (!controller.signal.aborted) {
          setSong(payload);
          setLoadError(null);
          setIsLoadingSong(false);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setLoadError("No se pudo cargar la cancion.");
          setIsLoadingSong(false);
          setSong(null);
        }
      }
    };

    void loadSong();

    let pollInterval: NodeJS.Timeout | null = null;

    if (song?.status === "processing") {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${songId}`, { cache: "no-store" });
          if (res.ok) {
            const status = await res.json();
            setJobStatus(status);
            if (status.status === "completed") {
              if (status.song) {
                setSong((prev) => (prev ? { ...prev, ...status.song } : status.song));
              }
              setIsLoadingSong(false);
              setJobStatus(null);
              if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
            } else if (status.status === "error" || status.status === "failed") {
              setJobStatus(status);
              setIsLoadingSong(false);
              if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
            }
          }
        } catch (e) {
          console.error("Poll error:", e);
        }
      }, POLL_INTERVAL_MS);
    }

    return () => {
      controller.abort();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [songId, song?.status]);

  const handleSeparateOnDemand = async () => {
    if (!songId || isSeparatingOnDemand) return;
    setIsSeparatingOnDemand(true);
    try {
      const response = await fetch(`/api/catalog/${songId}/separate`, { method: "POST" });
      if (!response.ok) {
        alert("Ocurrió un error al procesar la instrumental. Inténtalo de nuevo. 💕");
        setIsSeparatingOnDemand(false);
        return;
      }
      const data = await response.json();

      if (data.status === "ok" && data.instrumental_url) {
        setSong((prev) => (prev ? { ...prev, instrumentalUrl: data.instrumental_url } : null));
        setIsSeparatingOnDemand(false);
        return;
      }

      const pollId = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${songId}`, { cache: "no-store" });
          if (!res.ok) return;
          const status = await res.json();
          setJobStatus(status);

          if (status.status === "completed") {
            clearInterval(pollId);
            const songRes = await fetch(`/api/catalog/${songId}`, { cache: "no-store" });
            if (songRes.ok) setSong(await songRes.json());
            setJobStatus(null);
            setIsSeparatingOnDemand(false);
          } else if (status.status === "error" || status.status === "failed") {
            clearInterval(pollId);
            setJobStatus(null);
            setIsSeparatingOnDemand(false);
            alert("Error al generar la instrumental.");
          }
        } catch (e) {
          console.error("Poll error:", e);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      console.error(err);
      alert("Error de red al procesar la instrumental.");
      setIsSeparatingOnDemand(false);
    }
  };

  return {
    song,
    setSong,
    isLoadingSong,
    loadError,
    jobStatus,
    isSeparatingOnDemand,
    handleSeparateOnDemand,
    pendingSeekRef,
  };
}
