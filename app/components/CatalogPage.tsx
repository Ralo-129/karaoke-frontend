"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Music2,
  Search,
  Mic2,
  Disc3,
  Heart,
  Sparkles,
  HeartPulse,
  Plus,
  Users,
  ChevronLeft,
  Folder,
  Play,
  LayoutGrid,
  LayoutList,
  ListPlus,
  X,
} from "lucide-react";
import { type Song } from "../data/songs";
import { CATALOG_PAGE_SIZE, POLL_INTERVAL_MS } from "../lib/constants";
import { mapSongRow } from "../lib/catalog";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useFavorites } from "../hooks/useFavorites";
import { useQueue } from "../context/QueueContext";

const PAGE_SIZE = CATALOG_PAGE_SIZE;

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  total,
  page,
  onChange,
}: {
  total: number;
  page: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/40 bg-white/60 text-rose-400 transition hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-rose-300 text-sm font-bold">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
              page === p
                ? "bg-zinc-900 text-white shadow-lg scale-110"
                : "border-2 border-white/40 bg-white/60 text-rose-400 hover:bg-rose-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        disabled={page === total}
        onClick={() => onChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/40 bg-white/60 text-rose-400 transition hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      >
        ›
      </button>
    </div>
  );
}

// ─── SongCard (grid view) ──────────────────────────────────────────────────────

function SongCard({
  song,
  remoteSongIds,
  deletingSongId,
  onDelete,
  isFavorite,
  onToggleFavorite,
  onAddToQueue,
  inQueue,
}: {
  song: Song;
  remoteSongIds: Set<string>;
  deletingSongId: string | null;
  onDelete: (id: string, title: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToQueue: (song: Song) => void;
  inQueue: boolean;
}) {
  const isProcessing = song.status === "processing";
  return (
    <div
      className={`flex h-full flex-col justify-between gap-4 rounded-[2.5rem] border-2 border-white/60 bg-white/85 p-6 text-left transition-all hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_10px_40px_rgb(251,113,133,0.2)] ${
        isProcessing ? "opacity-90" : ""
      }`}
    >
      <Link className="group space-y-4" href={`/musica/${song.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-inner ${
              isProcessing ? "bg-rose-50 text-rose-400" : "bg-rose-100 text-rose-500"
            }`}
          >
            {isProcessing ? (
              <Sparkles className="h-6 w-6 animate-pulse" />
            ) : (
              <Disc3 className="h-6 w-6 group-hover:animate-[spin_4s_linear_infinite]" />
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isProcessing
                ? "bg-rose-400/10 text-rose-500 animate-pulse"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {isProcessing ? "PROCESANDO" : song.duration}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-800 line-clamp-1">{song.title}</h3>
          <p className="text-sm font-medium text-rose-400/80">{song.artist}</p>
        </div>
        {isProcessing ? (
          <div className="rounded-2xl bg-rose-50/50 px-4 py-3 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-widest">
              <HeartPulse className="h-3 w-3 animate-pulse" />
              <span>Sincronizando Magia...</span>
            </div>
            <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-400 animate-[shimmer_2s_infinite_linear] bg-[length:200%_100%] bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400" />
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-rose-50/50 px-4 py-3 text-xs font-medium text-zinc-600 italic">
            &quot;
            {(song.lrcPreview || "Canción sin letra...")
              .replace(/\[\d{2}:\d{2}\.\d{2}\]/g, "")
              .replace(/<\d{2}:\d{2}\.\d{2}>/g, "")
              .trim()}
            &quot;
          </p>
        )}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-zinc-500">
        <div className="flex gap-2">
          {song.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            onClick={(e) => { e.preventDefault(); onToggleFavorite(song.id); }}
            className="transition-transform hover:scale-110"
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-rose-500 text-rose-500" : "text-rose-200 hover:text-rose-400"}`} />
          </button>
          <button
            type="button"
            aria-label={inQueue ? "Ya está en la cola" : "Agregar a la cola"}
            onClick={(e) => { e.preventDefault(); onAddToQueue(song); }}
            disabled={inQueue || song.status === "processing"}
            className="transition-transform hover:scale-110 disabled:opacity-40"
            title={inQueue ? "Ya está en la cola" : "Agregar a la cola"}
          >
            <ListPlus className={`h-4 w-4 transition-colors ${inQueue ? "text-rose-400" : "text-zinc-300 hover:text-rose-400"}`} />
          </button>
          {remoteSongIds.has(song.id) && !isProcessing ? (
            <button
              className="rounded-full border border-rose-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete(song.id, song.title);
              }}
              disabled={deletingSongId === song.id}
            >
              {deletingSongId === song.id ? "Eliminando..." : "Eliminar"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── SongRow (compact list for artist drill-down) ──────────────────────────────

function SongRow({
  song,
  remoteSongIds,
  deletingSongId,
  onDelete,
  isFavorite,
  onToggleFavorite,
  onAddToQueue,
  inQueue,
}: {
  song: Song;
  remoteSongIds: Set<string>;
  deletingSongId: string | null;
  onDelete: (id: string, title: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToQueue: (song: Song) => void;
  inQueue: boolean;
}) {
  const isProcessing = song.status === "processing";
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur-md hover:bg-white/90 transition-all">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isProcessing ? "bg-rose-50 text-rose-300" : "bg-rose-100 text-rose-500"
        }`}
      >
        {isProcessing ? (
          <Sparkles className="h-4 w-4 animate-pulse" />
        ) : (
          <Disc3 className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-zinc-800 truncate">{song.title}</p>
        <p className="text-xs text-rose-400/80">{song.artist}</p>
      </div>
      <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500">
        {isProcessing ? "..." : song.duration}
      </span>
      <button
        type="button"
        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        onClick={() => onToggleFavorite(song.id)}
        className="shrink-0 transition-transform hover:scale-110"
      >
        <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-rose-500 text-rose-500" : "text-rose-200 hover:text-rose-400"}`} />
      </button>
      <button
        type="button"
        aria-label={inQueue ? "Ya está en la cola" : "Agregar a la cola"}
        onClick={() => onAddToQueue(song)}
        disabled={inQueue || isProcessing}
        className="shrink-0 transition-transform hover:scale-110 disabled:opacity-40"
        title={inQueue ? "Ya está en la cola" : "Agregar a la cola"}
      >
        <ListPlus className={`h-4 w-4 transition-colors ${inQueue ? "text-rose-400" : "text-zinc-300 hover:text-rose-400"}`} />
      </button>
      <Link
        href={`/musica/${song.id}`}
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600 transition"
      >
        <Play className="h-3 w-3 fill-white" />
      </Link>
      {remoteSongIds.has(song.id) && !isProcessing && (
        <button
          className="shrink-0 rounded-full border border-rose-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:bg-rose-100 disabled:opacity-70"
          type="button"
          onClick={() => onDelete(song.id, song.title)}
          disabled={deletingSongId === song.id}
        >
          {deletingSongId === song.id ? "..." : "Eliminar"}
        </button>
      )}
    </div>
  );
}

// ─── CatalogPage ───────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [totalSongs, setTotalSongs] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "todo" | "por-artista" | "favoritos" | "pop" | "rock" | "anime" | "baladas"
  >("todo");
  const { favorites, toggle: toggleFavorite } = useFavorites();
  const { queue, addToQueue, removeFromQueue } = useQueue();
  const [showQueue, setShowQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remoteSongIds, setRemoteSongIds] = useState<Set<string>>(new Set());
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [artistPage, setArtistPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Easter egg
  useEffect(() => {
    if (searchQuery.trim() === "12/05/2025") router.push("/secret");
  }, [searchQuery, router]);

  // Debounce search: 300ms delay before hitting the server
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      // "por-artista" and "favoritos" need all songs — skip pagination
      if (activeTab === "por-artista" || activeTab === "favoritos") {
        params.set("limit", "500");
      } else {
        params.set("page", String(currentPage));
        params.set("limit", String(PAGE_SIZE));
        if (activeTab !== "todo") params.set("tag", activeTab);
      }
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await fetch(`/api/catalog?${params}`);
      if (response.ok) {
        const payload = (await response.json()) as { songs: Song[]; total: number };
        setSongs(payload.songs);
        setTotalSongs(payload.total);
        setRemoteSongIds(new Set(payload.songs.map((s) => s.id)));
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, activeTab]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const hasProcessing = useMemo(
    () => songs.some((song) => song.status === "processing"),
    [songs]
  );

  // Realtime: update songs state when DB changes without polling
  useEffect(() => {
    if (!supabaseBrowser) {
      // Fallback: poll when Supabase Realtime is not available
      if (!hasProcessing) return;
      const interval = setInterval(fetchSongs, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }

    const channel = supabaseBrowser
      .channel("catalog-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "songs" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = mapSongRow(payload.new as Record<string, unknown>);
            setSongs((prev) =>
              prev.map((s) => (s.id === updated.id ? { ...s, ...updated } as Song : s))
            );
          } else if (payload.eventType === "INSERT") {
            fetchSongs();
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as Record<string, unknown>).job_id as string;
            setSongs((prev) => prev.filter((s) => s.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => { void supabaseBrowser?.removeChannel(channel); };
  }, [hasProcessing, fetchSongs]);

  // Reset pages and selectedArtist when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedArtist(null);
    setArtistPage(1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    setArtistPage(1);
  }, [debouncedSearch]);

  // ── Artist grouping (folder view — songs already loaded without pagination) ──
  const songsByArtist = useMemo(() => {
    const groups: Record<string, Song[]> = {};
    for (const song of songs) {
      const key = song.artist || "Sin artista";
      if (!groups[key]) groups[key] = [];
      groups[key].push(song);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [songs]);

  // ── Songs for the selected artist (with client-side search within artist) ──
  const artistSongs = useMemo(() => {
    if (!selectedArtist) return [];
    return songs.filter(
      (s) =>
        (s.artist || "Sin artista") === selectedArtist &&
        (debouncedSearch === "" ||
          s.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          s.tags.some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase())))
    );
  }, [selectedArtist, songs, debouncedSearch]);

  // ── Pagination (server-side for main tabs, client-side for artist drill-down) ──
  const totalPages = activeTab === "por-artista"
    ? 1
    : Math.ceil(totalSongs / PAGE_SIZE);
  const pagedSongs = songs; // Already paginated by the server

  // ── Pagination for artist drill-down ──
  const artistTotalPages = Math.ceil(artistSongs.length / PAGE_SIZE);
  const pagedArtistSongs = artistSongs.slice(
    (artistPage - 1) * PAGE_SIZE,
    artistPage * PAGE_SIZE
  );

  const handleDeleteSong = async (id: string, title: string) => {
    if (!confirm(`¿Seguro que quieres eliminar "${title}" del cofre de recuerdos? 🥺`)) return;

    setDeletingSongId(id);
    try {
      const response = await fetch(`/api/catalog/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSongs((prev) => prev.filter((s) => s.id !== id));
        setRemoteSongIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        alert("No se pudo eliminar la canción.");
      }
    } catch {
      alert("Error al conectar con el servidor.");
    } finally {
      setDeletingSongId(null);
    }
  };

  // ── Shared card props ──
  const cardProps = {
    remoteSongIds,
    deletingSongId,
    onDelete: handleDeleteSong,
    onToggleFavorite: toggleFavorite,
    onAddToQueue: addToQueue,
  };

  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (dir: "left" | "right") => {
    tabsRef.current?.scrollBy({ left: dir === "right" ? 200 : -200, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff1f2,_#fce7f3_50%,_#fdf2f8_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
            <Sparkles className="h-4 w-4" />
            Catálogo Mágico
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight sm:text-6xl">
            Nuestras{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
              Canciones
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg font-medium text-rose-400/80">
            Cada melodía es un recuerdo, cada letra un sentimiento. Elige la que más te guste y
            cantemos juntos. 💕
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-300 transition-colors group-focus-within:text-rose-500" />
            <input
              className="w-full rounded-[2rem] border-2 border-white/60 bg-white/85 px-14 py-5 text-lg font-medium text-zinc-800 placeholder:text-rose-200 focus:bg-white/95 focus:outline-none focus:ring-4 focus:ring-rose-100/50 transition-all shadow-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca por título, artista o etiqueta..."
              type="text"
              value={searchQuery}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            {/* Cola de canciones */}
            {queue.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQueue((v) => !v)}
                  className="flex items-center gap-2 rounded-full border-2 border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-500 transition-all hover:bg-rose-50"
                >
                  <ListPlus className="h-4 w-4" />
                  Cola ({queue.length})
                </button>
                {showQueue && (
                  <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-rose-100 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-rose-50 px-4 py-3">
                      <span className="text-sm font-bold text-zinc-700">Cola de canciones</span>
                      <button type="button" onClick={() => setShowQueue(false)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                      {queue.map((s, i) => (
                        <li key={s.id} className="flex items-center gap-3 px-4 py-2 hover:bg-rose-50">
                          <span className="text-xs text-zinc-400">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-700">{s.title}</p>
                            <p className="truncate text-xs text-zinc-400">{s.artist}</p>
                          </div>
                          <button type="button" onClick={() => removeFromQueue(s.id)} className="shrink-0 text-zinc-300 hover:text-rose-400">
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-full bg-rose-500 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_20px_rgb(251,113,133,0.3)] transition-all hover:bg-rose-600 hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Subir Nueva Canción
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/60 text-rose-400 text-lg font-bold transition hover:bg-rose-50"
              aria-label="Scroll izquierda"
            >
              ‹
            </button>
            <div
              ref={tabsRef}
              className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
            >
              {(["todo", "por-artista", "favoritos", "pop", "rock", "anime", "baladas"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`shrink-0 rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200 scale-105"
                      : "bg-white/60 text-rose-400 hover:bg-rose-50 border-2 border-white/40"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {tab === "por-artista" ? "Por Artista" : tab === "favoritos" ? "❤️ Favoritos" : tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/60 text-rose-400 text-lg font-bold transition hover:bg-rose-50"
              aria-label="Scroll derecha"
            >
              ›
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-12 w-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
            <p className="font-bold text-rose-400 animate-pulse uppercase tracking-widest text-xs">
              Abriendo el cofre...
            </p>
          </div>
        ) : (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="space-y-8">

              {/* ── Section header ── */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeTab === "por-artista" && selectedArtist && (
                    <button
                      type="button"
                      onClick={() => { setSelectedArtist(null); setArtistPage(1); }}
                      className="flex items-center gap-1 rounded-full border-2 border-white/40 bg-white/60 px-4 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Artistas
                    </button>
                  )}
                  <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-3">
                    {activeTab === "por-artista" ? (
                      <Users className="h-6 w-6 text-rose-500" />
                    ) : (
                      <Mic2 className="h-6 w-6 text-rose-500" />
                    )}
                    {activeTab === "todo"
                      ? "Todas las Canciones"
                      : activeTab === "por-artista"
                      ? selectedArtist ?? "Por Artista"
                      : activeTab === "favoritos"
                      ? "Mis Favoritas"
                      : `Género: ${activeTab}`}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-rose-400 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100">
                    {activeTab === "por-artista"
                      ? selectedArtist
                        ? `${artistSongs.length} ${artistSongs.length === 1 ? "melodía" : "melodías"}`
                        : `${songsByArtist.length} ${songsByArtist.length === 1 ? "artista" : "artistas"}`
                      : `${totalSongs} Melodías`}
                  </div>
                  {/* View mode toggle — hidden on the artist folder grid */}
                  {!(activeTab === "por-artista" && !selectedArtist) && (
                    <div className="flex rounded-full border-2 border-white/40 bg-white/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`flex items-center justify-center p-2 transition-all ${
                          viewMode === "grid"
                            ? "bg-zinc-900 text-white"
                            : "text-rose-400 hover:bg-rose-50"
                        }`}
                        title="Vista tarjeta"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`flex items-center justify-center p-2 transition-all ${
                          viewMode === "list"
                            ? "bg-zinc-900 text-white"
                            : "text-rose-400 hover:bg-rose-50"
                        }`}
                        title="Vista lista"
                      >
                        <LayoutList className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── "Por Artista" — folder grid ── */}
              {activeTab === "por-artista" && !selectedArtist && (
                <>
                  {songsByArtist.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {songsByArtist.map(([artistName, artistSongList]) => (
                        <button
                          key={artistName}
                          type="button"
                          onClick={() => { setSelectedArtist(artistName); setArtistPage(1); }}
                          className="flex flex-col items-center gap-3 rounded-[2rem] border-2 border-white/60 bg-white/70 p-6 text-center transition-all hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_10px_40px_rgb(251,113,133,0.2)] backdrop-blur-md"
                        >
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                            <Folder className="h-8 w-8" />
                          </div>
                          <p className="font-bold text-zinc-800 line-clamp-2 leading-tight">
                            {artistName}
                          </p>
                          <span className="rounded-full bg-rose-50 border border-rose-100 px-3 py-0.5 text-xs font-bold text-rose-400">
                            {artistSongList.length}{" "}
                            {artistSongList.length === 1 ? "melodía" : "melodías"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── "Por Artista" — artist drill-down (compact list) ── */}
              {activeTab === "por-artista" && selectedArtist && (
                <>
                  {artistSongs.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      {viewMode === "grid" ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {pagedArtistSongs.map((song) => (
                            <SongCard key={song.id} song={song} isFavorite={favorites.has(song.id)} inQueue={queue.some((q) => q.id === song.id)} {...cardProps} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {pagedArtistSongs.map((song) => (
                            <SongRow key={song.id} song={song} isFavorite={favorites.has(song.id)} inQueue={queue.some((q) => q.id === song.id)} {...cardProps} />
                          ))}
                        </div>
                      )}
                      <Pagination
                        total={artistTotalPages}
                        page={artistPage}
                        onChange={(p) => { setArtistPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      />
                    </>
                  )}
                </>
              )}

              {/* ── Favoritos ── */}
              {activeTab === "favoritos" && (
                <>
                  {songs.filter((s) => favorites.has(s.id)).length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-16 text-center text-zinc-400">
                      <Heart className="h-12 w-12 text-rose-200" />
                      <p className="font-bold">No tenés favoritos todavía</p>
                      <p className="text-sm">Presioná el ❤️ en cualquier canción para guardarla acá.</p>
                    </div>
                  ) : (
                    <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"}>
                      {songs.filter((s) => favorites.has(s.id)).map((song) =>
                        viewMode === "grid"
                          ? <SongCard key={song.id} song={song} isFavorite={true} inQueue={queue.some((q) => q.id === song.id)} {...cardProps} />
                          : <SongRow key={song.id} song={song} isFavorite={true} inQueue={queue.some((q) => q.id === song.id)} {...cardProps} />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── Genre / Todo grid with pagination ── */}
              {activeTab !== "por-artista" && activeTab !== "favoritos" && (
                <>
                  {songs.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      {viewMode === "grid" ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {pagedSongs.map((song) => (
                            <SongCard key={song.id} song={song} isFavorite={favorites.has(song.id)} inQueue={queue.some((q) => q.id === song.id)} {...cardProps} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {pagedSongs.map((song) => (
                            <SongRow key={song.id} song={song} isFavorite={favorites.has(song.id)} inQueue={queue.some((q) => q.id === song.id)} {...cardProps} />
                          ))}
                        </div>
                      )}
                      <Pagination
                        total={totalPages}
                        page={currentPage}
                        onChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      />
                    </>
                  )}
                </>
              )}

            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-rose-200 bg-white/70 px-4 py-16 text-center text-rose-400">
      <Music2 className="h-12 w-12 opacity-50" />
      <p className="text-lg font-medium">Aún no tenemos canciones aquí 🥺</p>
      <p className="text-sm text-rose-300">No hay canciones en el catalogo.</p>
    </div>
  );
}
