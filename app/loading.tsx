/**
 * Global Loading Component
 * Uses CSS-only animations for maximum performance
 * Displays while page content is being loaded/streamed
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#030305] relative overflow-hidden">
      {/* Static gradient background - no JS animations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,169,72,0.08)_0%,transparent_60%)] blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(184,134,11,0.06)_0%,transparent_60%)] blur-3xl opacity-50" />
      </div>

      {/* Content skeleton */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header skeleton with shimmer effect */}
          <div className="relative overflow-hidden h-36 bg-gradient-to-r from-[rgba(212,169,72,0.08)] via-[rgba(184,134,11,0.05)] to-[rgba(212,169,72,0.08)] rounded-2xl border border-[rgba(212,169,72,0.15)]">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[rgba(212,169,72,0.1)] to-transparent" />
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden h-28 bg-gradient-to-br from-[rgba(212,169,72,0.06)] to-[rgba(10,10,12,0.9)] rounded-xl border border-[rgba(212,169,72,0.1)]"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div
                  className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[rgba(212,169,72,0.08)] to-transparent"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="relative overflow-hidden h-[500px] bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.1)]">
            {/* Table header skeleton */}
            <div className="h-14 border-b border-[rgba(212,169,72,0.1)] bg-[rgba(212,169,72,0.03)] flex items-center px-4 gap-4">
              {[80, 120, 100, 90, 110].map((width, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-[rgba(212,169,72,0.1)]"
                  style={{ width: `${width}px` }}
                />
              ))}
            </div>

            {/* Table rows skeleton */}
            <div className="p-4 space-y-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-[rgba(212,169,72,0.03)] border border-[rgba(212,169,72,0.05)] flex items-center px-4 gap-4"
                  style={{
                    opacity: 1 - i * 0.1,
                    animationDelay: `${i * 100}ms`
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-[rgba(212,169,72,0.08)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-[rgba(212,169,72,0.08)]" />
                    <div className="h-2 w-16 rounded bg-[rgba(212,169,72,0.05)]" />
                  </div>
                  <div className="h-3 w-16 rounded bg-[rgba(212,169,72,0.06)]" />
                  <div className="h-3 w-20 rounded bg-[rgba(212,169,72,0.06)]" />
                  <div className="h-6 w-16 rounded-full bg-[rgba(212,169,72,0.08)]" />
                </div>
              ))}
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[rgba(212,169,72,0.05)] to-transparent" />
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-full bg-[rgba(10,10,12,0.9)] border border-[rgba(212,169,72,0.2)] backdrop-blur-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#d4a948] animate-[bounce_1s_infinite]"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="text-sm text-[rgba(212,169,72,0.8)] font-medium">Loading...</span>
      </div>

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030305] to-transparent pointer-events-none z-0" />
    </div>
  );
}
