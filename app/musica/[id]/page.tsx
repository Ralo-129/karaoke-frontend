"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Play, Pause, Rewind, FastForward, HeartPulse, Sparkles, Music2 } from "lucide-react";
import {
  SYNC_THRESHOLD_S,
  SEEK_OFFSET_S,
  LYRICS_FADE_MIN_OPACITY,
  LYRICS_FADE_OPACITY_DECAY,
  LYRICS_FADE_MIN_SCALE,
  LYRICS_FADE_SCALE_DECAY,
  LYRICS_BLUR_MAX_PX,
  LYRICS_BLUR_DECAY,
  COUNTDOWN_SHOW_GAP_S,
  COUNTDOWN_SHOW_REMAINING_S,
  LYRICS_WINDOW,
} from "../../lib/constants";
import { useSongData } from "../../hooks/useSongData";
import { useParsedLyrics } from "../../hooks/useParsedLyrics";
import { useMediaSync } from "../../hooks/useMediaSync";
import { useVideoSeek } from "../../hooks/useVideoSeek";
import { useLyricsScroll } from "../../hooks/useLyricsScroll";
import { useHeartPosition } from "../../hooks/useHeartPosition";

export default function SongPage() {
  const params = useParams<{ id?: string | string[] }>();
  const songId = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    song,
    isLoadingSong,
    loadError,
    jobStatus,
    isSeparatingOnDemand,
    handleSeparateOnDemand,
    pendingSeekRef,
  } = useSongData(songId);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEndOptions, setShowEndOptions] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [instrumentalReady, setInstrumentalReady] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sourceVideoUrl = song?.videoUrl ?? videoUrl;

  const { lyrics, activeLyricIndex } = useParsedLyrics(song?.lrc, currentTime);

  const visibleLyrics = useMemo(() => {
    const start = Math.max(0, activeLyricIndex - LYRICS_WINDOW);
    const end = Math.min(lyrics.length - 1, activeLyricIndex + LYRICS_WINDOW);
    return lyrics.slice(start, end + 1).map((line, i) => ({
      ...line,
      originalIndex: start + i,
    }));
  }, [lyrics, activeLyricIndex]);

  useMediaSync({
    isPlaying,
    instrumentalUrl: song?.instrumentalUrl,
    sourceVideoUrl,
    videoRef,
    audioRef,
  });

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const { containerOffset, setLyricRef } = useLyricsScroll(activeLyricIndex);
  const { heartPos } = useHeartPosition(currentTime, activeLyricIndex, lyrics);
  const { handleSeek } = useVideoSeek({ videoRef, audioRef, duration, pendingSeekRef, setCurrentTime });

  if (isLoadingSong) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff1f2,_#fce7f3_50%,_#fdf2f8_100%)]">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
          <Link
            className="w-fit rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
            href="/catalogo"
          >
            Volver al catalogo
          </Link>
          <div className="rounded-3xl border border-white/50 bg-white/40 p-6 shadow-[0_8px_30px_rgb(251,113,133,0.1)] backdrop-blur-md">
            Cargando cancion...
          </div>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff1f2,_#fce7f3_50%,_#fdf2f8_100%)]">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
          <Link
            className="w-fit rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
            href="/catalogo"
          >
            Volver al catalogo
          </Link>
          <div className="rounded-3xl border border-white/50 bg-white/40 p-6 shadow-[0_8px_30px_rgb(251,113,133,0.1)] backdrop-blur-md">
            {loadError ?? "Cancion no encontrada."}
          </div>
        </div>
      </div>
    );
  }

  if (song?.status === "processing") {
    const progress = jobStatus?.progress ?? 5;
    const statusMessage = jobStatus?.message ?? "Procesando...";
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff1f2,_#fce7f3_50%,_#fdf2f8_100%)] flex flex-col">
        <header className="px-6 py-12 flex items-center relative">
          <Link
            className="rounded-full border border-black/5 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 bg-white/80 hover:bg-white transition-all shadow-sm"
            href="/catalogo"
          >
            Volver al catalogo
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 shadow-sm border border-rose-100">

              <Sparkles className="h-3 w-3 text-rose-300" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 -mt-20">
          <div className="w-full max-w-2xl rounded-[3rem] bg-white/40 p-12 shadow-[0_20px_50px_rgba(251,113,133,0.1)] backdrop-blur-xl border-4 border-white/60 flex flex-col items-center text-center">

            <div className="relative mb-8">
              <div className="h-32 w-32 rounded-full border-4 border-rose-100 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-4 border-rose-500 transition-all duration-1000"
                  style={{
                    clipPath: `inset(0 0 0 0)`,
                    maskImage: `conic-gradient(#000 ${progress}%, transparent ${progress}%)`,
                    WebkitMaskImage: `conic-gradient(#000 ${progress}%, transparent ${progress}%)`
                  }}
                />
                <HeartPulse className="h-12 w-12 text-rose-500 animate-pulse" />
              </div>
            </div>

            <h2 className="text-3xl font-black text-zinc-800 mb-2 tracking-tight">
              Sincronizando Magia...
            </h2>
            <p className="text-rose-400 font-medium">
              {statusMessage}
            </p>
            <p className="text-rose-300 text-sm mt-2 mb-12">
              Estamos preparando todo para que puedas cantar a todo pulmón. ✨
            </p>

            <div className="w-full space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-rose-500">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 w-full bg-rose-100 rounded-full overflow-hidden border border-white">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff1f2,_#fce7f3_50%,_#fdf2f8_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700"
            href="/catalogo"
          >
            Volver al catalogo
          </Link>
          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-zinc-600">
            {song.title}  {song.artist}
          </div>
        </div>

        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-6 rounded-[3rem] border-4 border-white/50 bg-white/40 p-8 shadow-[0_10px_40px_rgb(251,113,133,0.15)] backdrop-blur-xl">
            <div className="space-y-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] border-4 border-white/60 bg-zinc-900/90 shadow-inner">
                {sourceVideoUrl ? (
                  <video
                    ref={videoRef}
                    src={sourceVideoUrl}
                    preload="auto"
                    muted={Boolean(song?.instrumentalUrl)}
                    playsInline
                    webkit-playsinline="true"
                    className="h-full w-full object-cover"
                    onLoadedMetadata={(event) => {
                      const value = event.currentTarget.duration || 0;
                      if (value > 0) {
                        setDuration(value);
                      }
                      if (pendingSeekRef.current !== null) {
                        event.currentTarget.currentTime = pendingSeekRef.current;
                        setCurrentTime(pendingSeekRef.current);
                        pendingSeekRef.current = null;
                      }
                    }}
                    onLoadedData={() => {
                      setIsVideoReady(true);
                    }}
                    onCanPlay={() => setIsVideoReady(true)}
                    onTimeUpdate={(event) => {
                      if (!song?.instrumentalUrl) {
                        setCurrentTime(event.currentTarget.currentTime);
                      }
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      setShowEndOptions(true);
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-sm text-white/80">
                    <Music2 className="h-16 w-16 text-rose-300 opacity-50 animate-bounce" />
                    <p className="text-xl font-bold text-white">Escenario Mágico</p>
                    <p className="max-w-xs text-sm text-white/60">
                      Sube un archivo de video para probar la interfaz.
                    </p>
                  </div>
                )}

                {showEndOptions ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                    <button
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-900"
                      type="button"
                      onClick={() => {
                        setShowEndOptions(false);
                        setIsPlaying(true);
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                        }
                      }}
                    >
                      Repetir musica
                    </button>
                    <Link
                      className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                      href="/catalogo"
                    >
                      Volver al catalogo
                    </Link>
                  </div>
                ) : null}

                {/* Loading Overlay */}
                {isPlaying && sourceVideoUrl && !isVideoReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm z-20">
                    <div className="h-12 w-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                    <p className="text-white font-bold animate-pulse">Sincronizando magia...</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/40 bg-white/50 p-6 shadow-sm backdrop-blur-sm">
                {song.videoUrl ? (
                  <div className="flex flex-col gap-3 text-sm text-zinc-700">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Medios de la Canción
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <a
                        className="font-bold text-zinc-700 hover:text-rose-500 transition-colors flex items-center gap-1.5 underline"
                        href={song.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        🎬 Abrir video original
                      </a>

                      {song.instrumentalUrl ? (
                        <a
                          className="font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 underline"
                          href={song.instrumentalUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📥 Descargar instrumental
                        </a>
                      ) : (
                        <button
                          onClick={handleSeparateOnDemand}
                          disabled={isSeparatingOnDemand}
                          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-200 transition-all hover:scale-105 hover:shadow-rose-300 disabled:opacity-75 disabled:hover:scale-100"
                        >
                          {isSeparatingOnDemand ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Separando instrumental (Demucs AI)...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              Descargar Instrumental (Puro Karaoke)
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                      Subir video musical
                    </label>
                    <input
                      className="mt-3 w-full text-sm"
                      type="file"
                      accept="video/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setVideoUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return url;
                        });
                        setShowEndOptions(false);
                        setIsPlaying(false);
                        setCurrentTime(0);
                      }}
                    />
                  </>
                )}
              </div>

              <audio
                ref={audioRef}
                src={song?.instrumentalUrl ?? undefined}
                preload={song?.instrumentalUrl ? "auto" : "none"}
                style={{ display: "none" }}
                onCanPlay={() => {
                  if (song?.instrumentalUrl) setInstrumentalReady(true);
                }}
                onLoadedMetadata={(event) => {
                  if (!song?.instrumentalUrl) return;
                  const value = event.currentTarget.duration || 0;
                  setDuration(value);
                  if (pendingSeekRef.current !== null) {
                    event.currentTarget.currentTime = pendingSeekRef.current;
                    setCurrentTime(pendingSeekRef.current);
                    pendingSeekRef.current = null;
                  }
                }}
                onTimeUpdate={(event) => {
                  if (!song?.instrumentalUrl) return;
                  const t = event.currentTarget.currentTime;
                  setCurrentTime(t);
                  if (
                    videoRef.current &&
                    !videoRef.current.seeking &&
                    Math.abs(videoRef.current.currentTime - t) > SYNC_THRESHOLD_S
                  ) {
                    try {
                      videoRef.current.currentTime = t;
                    } catch (e) {
                      // ignore
                    }
                  }
                }}
                onEnded={() => {
                  if (!song?.instrumentalUrl) return;
                  setIsPlaying(false);
                  setShowEndOptions(true);
                }}
                onError={() => {
                  setInstrumentalReady(false);
                }}
              />

              <div
                className="rounded-[2rem] border-2 border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                role="region"
                aria-label="Reproductor de karaoke"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    e.preventDefault();
                    setIsPlaying((prev) => !prev);
                  } else if (e.code === "ArrowLeft") {
                    e.preventDefault();
                    handleSeek(-SEEK_OFFSET_S);
                  } else if (e.code === "ArrowRight") {
                    e.preventDefault();
                    handleSeek(SEEK_OFFSET_S);
                  }
                }}
              >
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <button
                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-500 transition-all hover:scale-110 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    type="button"
                    aria-label="Retroceder 10 segundos"
                    onClick={() => handleSeek(-SEEK_OFFSET_S)}
                    disabled={!sourceVideoUrl}
                  >
                    <Rewind className="h-6 w-6" />
                  </button>
                  <button
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-[0_0_20px_rgb(251,113,133,0.5)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgb(251,113,133,0.8)] disabled:opacity-50 disabled:hover:scale-100"
                    type="button"
                    aria-label={isPlaying ? "Pausar" : "Reproducir"}
                    aria-pressed={isPlaying}
                    onClick={() => setIsPlaying((prev) => !prev)}
                    disabled={Boolean(!sourceVideoUrl || (sourceVideoUrl && !isVideoReady) || (song?.instrumentalUrl && !instrumentalReady))}
                  >
                    {(!isVideoReady && sourceVideoUrl && isPlaying) || (song?.instrumentalUrl && !instrumentalReady && isPlaying) ? (
                      <div className="h-8 w-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                      <Pause className="h-10 w-10 fill-current" />
                    ) : (
                      <Play className="h-10 w-10 fill-current ml-2" />
                    )}
                  </button>
                  <button
                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-500 transition-all hover:scale-110 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    type="button"
                    aria-label="Avanzar 10 segundos"
                    onClick={() => handleSeek(SEEK_OFFSET_S)}
                    disabled={!sourceVideoUrl}
                  >
                    <FastForward className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-4 text-xs font-bold text-rose-400">
                  <span>{currentTime.toFixed(1)}s</span>
                  <input
                    className="mt-4 w-full"
                    type="range"
                    role="slider"
                    aria-label="Posición de reproducción"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(currentTime)}
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setCurrentTime(value);
                      if (videoRef.current) videoRef.current.currentTime = value;
                    }}
                  />
                  <div className="mt-2 text-right text-xs font-bold text-rose-400">
                    {duration.toFixed(1)}s
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 rounded-[3rem] border-4 border-white/50 bg-white/40 p-10 shadow-[0_10px_40px_rgb(251,113,133,0.15)] backdrop-blur-xl">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="inline-flex items-center justify-center rounded-full bg-rose-100 p-3 text-rose-500 shadow-inner">
                <HeartPulse className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-zinc-800 tracking-tight mt-2">{song.title}</h2>
              <p className="text-lg font-medium text-rose-500/80">{song.artist}</p>
            </div>

            <div className="w-full max-w-4xl rounded-[2.5rem] border-2 border-white/60 bg-white/50 p-8 shadow-inner backdrop-blur-sm">
              <div
                id="lyrics-container"
                className="relative h-[50vh] overflow-hidden p-4"
                style={{
                  maskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
                }}
              >
                <div
                  className="flex flex-col gap-6 text-center transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateY(${containerOffset}px)` }}
                >
                  {/* Countdown Dots */}
                  {(() => {
                    const nextLine = lyrics[activeLyricIndex + 1];
                    const currentLine = lyrics[activeLyricIndex];
                    if (!currentLine || !nextLine) return null;

                    const gap = nextLine.time - currentLine.endTime;
                    const timeLeft = nextLine.time - currentTime;

                    if (gap > COUNTDOWN_SHOW_GAP_S && timeLeft > 0 && timeLeft < COUNTDOWN_SHOW_REMAINING_S) {
                      const dots = Math.ceil(timeLeft);
                      return (
                        <div className="flex justify-center gap-4 py-4 animate-pulse">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-4 w-4 rounded-full transition-all duration-300 ${3 - i <= dots ? "bg-rose-500 scale-125 shadow-[0_0_15px_rgb(251,113,133,0.8)]" : "bg-rose-200"
                                }`}
                            />
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {visibleLyrics.map((line) => {
                    const index = line.originalIndex;
                    const isActive = index === activeLyricIndex;
                    const distance = Math.abs(index - activeLyricIndex);

                    const opacity = isActive ? 1 : Math.max(LYRICS_FADE_MIN_OPACITY, 1 - distance * LYRICS_FADE_OPACITY_DECAY);
                    const scale = isActive ? 1 : Math.max(LYRICS_FADE_MIN_SCALE, 1 - distance * LYRICS_FADE_SCALE_DECAY);
                    const blur = isActive ? 0 : Math.min(LYRICS_BLUR_MAX_PX, distance * LYRICS_BLUR_DECAY);

                    const isPast = index < activeLyricIndex;
                    const nextLine = lyrics[index + 1];
                    const lineDuration = nextLine ? nextLine.time - line.time : 4;

                    let bgPosX = "100%";
                    if (isActive) {
                      const progress = Math.max(0, Math.min(1, (currentTime - line.time) / lineDuration));
                      bgPosX = `${100 - (progress * 100)}%`;
                    }

                    return (
                      <div
                        key={`${line.time}-${line.text}`}
                        ref={setLyricRef(index)}
                        className={`transition-all duration-700 ease-in-out px-4 py-4`}
                        style={{
                          opacity: opacity,
                          transform: `scale(${scale})`,
                          filter: `blur(${blur}px)`,
                        }}
                      >
                        <div
                          className={`font-black tracking-tight transition-all duration-[50ms] flex flex-wrap justify-center ${isActive || isPast
                            ? "text-3xl sm:text-5xl leading-tight drop-shadow-[0_0_25px_rgb(251,113,133,0.3)]"
                            : "text-xl sm:text-3xl"
                            }`}
                        >
                          {line.words.map((word, wIndex) => {
                            let wordBgPosX = "100%";
                            const isWordPast = currentTime > word.endTime;
                            const isWordActive = currentTime >= word.startTime && currentTime <= word.endTime;

                            if (isWordActive) {
                              const wordProgress = Math.max(0, Math.min(1, (currentTime - word.startTime) / (word.endTime - word.startTime)));
                              wordBgPosX = `${100 - (wordProgress * 100)}%`;
                            }

                            return (
                              <span
                                key={`${index}-${wIndex}`}
                                id={`word-${index}-${wIndex}`}
                                className="relative inline-block transition-transform duration-300 mx-1"
                                style={
                                  isWordActive
                                    ? {
                                      backgroundImage: "linear-gradient(to right, #fb7185 0%, #ec4899 50%, #a1a1aa 50%, #a1a1aa 100%)",
                                      backgroundSize: "200% 100%",
                                      backgroundPosition: `${wordBgPosX} 0`,
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                      transform: "scale(1.2)",
                                    }
                                    : isWordPast || isPast
                                      ? {
                                        backgroundImage: "linear-gradient(to right, #fb7185, #ec4899)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                      }
                                      : {
                                        color: "inherit"
                                      }
                                }
                              >
                                {word.text}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bouncing Heart Guide */}
                <div
                  className="pointer-events-none absolute z-30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    left: `${heartPos.x}px`,
                    top: `${heartPos.y}px`,
                    opacity: heartPos.opacity,
                    transform: `translate(-50%, -100%) scale(${heartPos.opacity})`,
                  }}
                >
                  <div className="animate-bounce">
                    <HeartPulse className="h-6 w-6 text-rose-500 fill-rose-500 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-rose-200 bg-white/50 p-4 text-sm text-zinc-700 backdrop-blur-sm">
              <p className="font-semibold text-zinc-900">Al terminar</p>
              <p className="mt-1">
                Mostramos opciones de repetir o volver al catalogo cuando el
                video termina.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
