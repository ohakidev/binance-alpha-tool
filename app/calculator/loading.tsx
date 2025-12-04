/**
 * Calculator Page Loading State
 * Server-side streamed loading skeleton for better performance
 */

export default function CalculatorLoading() {
  return (
    <div className="min-h-screen bg-[#030305] p-4 md:p-8">
      {/* Premium gradient mesh background - CSS only for performance */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,169,72,0.1)_0%,transparent_60%)] blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(184,134,11,0.08)_0%,transparent_60%)] blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="flex justify-center">
            <div className="h-14 w-72 bg-gradient-to-r from-[rgba(212,169,72,0.15)] to-[rgba(184,134,11,0.08)] rounded-full border border-[rgba(212,169,72,0.2)]" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex justify-center">
            <div className="h-14 w-96 bg-[rgba(212,169,72,0.05)] rounded-xl border border-[rgba(212,169,72,0.12)]" />
          </div>

          {/* Content grid skeleton */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div
                className="h-72 bg-gradient-to-br from-[rgba(212,169,72,0.08)] via-[#0a0a0c] to-[rgba(184,134,11,0.04)] rounded-2xl border border-[rgba(212,169,72,0.15)]"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="h-72 bg-gradient-to-br from-[rgba(212,169,72,0.06)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.12)]"
                style={{ animationDelay: '100ms' }}
              />
            </div>
            <div className="space-y-6">
              <div
                className="h-72 bg-gradient-to-br from-[rgba(212,169,72,0.06)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.12)]"
                style={{ animationDelay: '200ms' }}
              />
              <div
                className="h-72 bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.02)] rounded-2xl border border-[rgba(212,169,72,0.1)]"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
