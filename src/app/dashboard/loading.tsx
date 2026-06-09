"use client";

export default function AnalyzeLoading() {
  return (
    <main
      id="main-content"
      aria-live="polite"
      aria-label="Analyzing your video"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4"
    >
      {/* Visually hidden heading for screen readers */}
      <h1 className="sr-only">Analyzing video — please wait</h1>

      {/* Spinner */}
      <div
        role="status"
        aria-hidden="true"
        className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-black animate-spin"
        style={{
          animation: "spin 1s linear infinite",
        }}
      />

      <div className="text-center max-w-sm">
        <p className="text-base font-medium text-gray-900">Analyzing your video</p>
        <p className="mt-1 text-sm text-gray-500">
          This takes 30–60 seconds. Do not close this tab.
        </p>
      </div>

      {/* Progress bar (purely visual; indeterminate) */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Analysis progress"
        className="w-full max-w-xs h-1.5 bg-gray-100 rounded-full overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="h-full bg-black rounded-full"
          style={{
            width: "40%",
            animation: "progress-indeterminate 2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-spin,
          [aria-hidden="true"] {
            animation: none !important;
          }
        }
        @keyframes progress-indeterminate {
          0%   { transform: translateX(-100%); width: 40%; }
          50%  { transform: translateX(150%);  width: 40%; }
          100% { transform: translateX(150%);  width: 40%; }
        }
      `}</style>
    </main>
  );
}
