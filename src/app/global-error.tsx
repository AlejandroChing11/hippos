"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-heading font-bold text-ink">
            Algo salió mal
          </h1>
          <p className="text-sm text-ink-secondary">
            Ocurrió un error inesperado. Intenta de nuevo.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-sage px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-dark"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
