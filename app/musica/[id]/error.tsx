"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SongError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Song page error:", error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <svg
            className="h-8 w-8 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-800">
          No se pudo cargar la canción
        </h2>
        <p className="max-w-sm text-sm text-zinc-500">
          {error.message || "La canción no existe o no está disponible. Verifica el enlace e intenta de nuevo."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full border border-rose-200 px-5 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 active:scale-95"
        >
          Reintentar
        </button>
        <button
          onClick={() => router.push("/catalogo")}
          className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90 active:scale-95"
        >
          Volver al catálogo
        </button>
      </div>
    </div>
  );
}
