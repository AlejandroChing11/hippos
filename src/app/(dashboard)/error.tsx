"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <h1 className="text-2xl font-heading font-bold text-ink">
        Algo salió mal
      </h1>
      <div className="rounded-xl border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger">
        {error.message || "Error inesperado"}
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-sage px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
      >
        Reintentar
      </button>
    </div>
  );
}
