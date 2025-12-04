/**
 * Calendar Loading State
 * Server-side rendered skeleton for instant feedback
 */

export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-[#030305] p-4 md:p-8">
      {/* Static gradient background - no JS needed */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,169,72,0.08)_0%,transparent_60%)] blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(184,134,11,0.06)_0%,transparent_60%)] blur-3xl opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[rgba(212,169,72,0.15)] to-[rgba(184,134,11,0.08)] animate-pulse" />
              <div className="space-y-2">
                <div className="h-7 w-48 rounded-lg bg-[rgba(212,169,72,0.1)] animate-pulse" />
                <div className="h-4 w-32 rounded bg-[rgba(212,169,72,0.06)] animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 rounded-xl bg-[rgba(212,169,72,0.08)] animate-pulse" />
              <div className="h-10 w-10 rounded-xl bg-[rgba(212,169,72,0.08)] animate-pulse" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 bg-gradient-to-br from-[rgba(212,169,72,0.06)] to-[rgba(10,10,12,0.9)] rounded-xl border border-[rgba(212,169,72,0.1)] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Calendar grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.1)] p-4">
                {/* Month header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="h-8 w-32 rounded bg-[rgba(212,169,72,0.1)] animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[rgba(212,169,72,0.08)] animate-pulse" />
                    <div className="h-8 w-8 rounded-lg bg-[rgba(212,169,72,0.08)] animate-pulse" />
                  </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-8 rounded bg-[rgba(212,169,72,0.05)] animate-pulse"
                    />
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-[rgba(212,169,72,0.03)] border border-[rgba(212,169,72,0.05)] animate-pulse"
                      style={{ animationDelay: `${(i % 7) * 50}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Side panel */}
            <div className="space-y-4">
              {/* Selected date info */}
              <div className="h-48 bg-gradient-to-br from-[rgba(212,169,72,0.06)] to-[rgba(10,10,12,0.9)] rounded-xl border border-[rgba(212,169,72,0.1)] animate-pulse" />

              {/* Users list */}
              <div className="h-64 bg-gradient-to-br from-[rgba(212,169,72,0.04)] to-[rgba(10,10,12,0.9)] rounded-xl border border-[rgba(212,169,72,0.1)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
