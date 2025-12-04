/**
 * Stability Page Loading State
 * Streaming-compatible loading skeleton for improved performance
 */

export default function StabilityLoading() {
  return (
    <div className="min-h-screen bg-[#030305] p-4 md:p-8">
      {/* Premium gradient mesh background - CSS only for performance */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,169,72,0.1)_0%,transparent_60%)] blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(184,134,11,0.08)_0%,transparent_60%)] blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div
            className="h-36 bg-gradient-to-r from-[rgba(212,169,72,0.08)] via-[rgba(184,134,11,0.05)] to-[rgba(212,169,72,0.08)] rounded-2xl border border-[rgba(212,169,72,0.15)] animate-pulse"
            style={{ animationDuration: '1.5s' }}
          />

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-gradient-to-br from-[rgba(212,169,72,0.06)] to-[rgba(10,10,12,0.9)] rounded-xl border border-[rgba(212,169,72,0.1)] animate-pulse"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>

          {/* Filter skeleton */}
          <div
            className="h-20 bg-[rgba(212,169,72,0.05)] rounded-xl border border-[rgba(212,169,72,0.12)] animate-pulse"
            style={{ animationDuration: '1.5s' }}
          />

          {/* Table skeleton */}
          <div className="bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.1)] overflow-hidden">
            {/* Table header */}
            <div className="h-14 bg-[rgba(212,169,72,0.08)] border-b border-[rgba(212,169,72,0.1)]" />

            {/* Table rows */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-16 border-b border-[rgba(212,169,72,0.05)] animate-pulse"
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationDuration: '1.5s'
                }}
              >
                <div className="flex items-center h-full px-4 gap-4">
                  <div className="w-8 h-8 rounded-full bg-[rgba(212,169,72,0.1)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-[rgba(212,169,72,0.1)] rounded" />
                    <div className="h-3 w-16 bg-[rgba(212,169,72,0.05)] rounded" />
                  </div>
                  <div className="h-4 w-20 bg-[rgba(212,169,72,0.1)] rounded" />
                  <div className="h-4 w-16 bg-[rgba(212,169,72,0.08)] rounded" />
                  <div className="h-4 w-12 bg-[rgba(212,169,72,0.06)] rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-8 w-32 bg-[rgba(212,169,72,0.05)] rounded animate-pulse" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-[rgba(212,169,72,0.08)] rounded animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
