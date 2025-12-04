/**
 * Settings Page Loading State
 * Premium Gold & Black Theme Skeleton
 */

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#030305] p-4 md:p-8">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,169,72,0.08)_0%,transparent_60%)] blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(184,134,11,0.06)_0%,transparent_60%)] blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-center mb-8">
            <div className="h-12 w-48 bg-gradient-to-r from-[rgba(212,169,72,0.15)] to-[rgba(184,134,11,0.08)] rounded-full border border-[rgba(212,169,72,0.2)]" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2 p-1 bg-[rgba(212,169,72,0.05)] rounded-xl border border-[rgba(212,169,72,0.12)]">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-24 bg-[rgba(212,169,72,0.08)] rounded-lg"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Content card skeleton */}
          <div className="bg-gradient-to-br from-[rgba(212,169,72,0.06)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.12)] p-6 space-y-6">
            {/* Section title */}
            <div className="h-6 w-40 bg-[rgba(212,169,72,0.1)] rounded-lg" />

            {/* Form fields */}
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-[rgba(212,169,72,0.08)] rounded" />
                  <div className="h-12 w-full bg-[rgba(212,169,72,0.05)] rounded-xl border border-[rgba(212,169,72,0.1)]" />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[rgba(212,169,72,0.2)] to-transparent" />

            {/* Toggle options */}
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[rgba(212,169,72,0.03)] rounded-xl border border-[rgba(212,169,72,0.08)]">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-[rgba(212,169,72,0.1)] rounded" />
                    <div className="h-3 w-48 bg-[rgba(212,169,72,0.06)] rounded" />
                  </div>
                  <div className="h-6 w-12 bg-[rgba(212,169,72,0.15)] rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex justify-end gap-3 pt-4">
            <div className="h-11 w-28 bg-[rgba(212,169,72,0.08)] rounded-xl border border-[rgba(212,169,72,0.1)]" />
            <div className="h-11 w-32 bg-gradient-to-r from-[rgba(212,169,72,0.2)] to-[rgba(184,134,11,0.15)] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
