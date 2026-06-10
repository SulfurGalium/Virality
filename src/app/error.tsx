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
    // Log to your error tracking service (e.g. Sentry) here
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
      aria-labelledby="error-heading"
    >
      <h1
        id="error-heading"
        className="text-xl font-medium text-gray-900"
      >
        Something went wrong
      </h1>

      <p className="text-sm text-gray-500 max-w-sm">
        An unexpected error occurred. Your data has not been lost. Try again — 
        if the problem continues, contact support.
      </p>

      <button
        onClick={reset}
        className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        Try again
      </button>

      {/* Show error digest in dev only — never show stack traces to users */}
      {process.env.NODE_ENV === "development" && error.digest && (
        <p className="text-xs text-gray-400 font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </main>
  );
}
