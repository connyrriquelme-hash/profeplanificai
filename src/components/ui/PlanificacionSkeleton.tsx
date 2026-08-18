/**
 * PlanificacionSkeleton — Premium skeleton loader for AI-generated plans.
 * Mimics the shape of a planning document while content loads.
 */

export function PlanificacionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-5 w-20 rounded-full bg-[var(--bg2)]" />
          <div className="h-5 w-16 rounded-full bg-[var(--bg2)]" />
        </div>
        <div className="h-8 w-3/4 rounded-lg bg-[var(--bg2)] mb-2" />
        <div className="h-4 w-1/2 rounded bg-[var(--bg2)]" />
        <div className="flex gap-2 mt-4">
          <div className="h-6 w-24 rounded-full bg-[var(--bg2)]" />
          <div className="h-6 w-20 rounded-full bg-[var(--bg2)]" />
          <div className="h-6 w-28 rounded-full bg-[var(--bg2)]" />
        </div>
      </div>

      {/* Section skeleton 1 */}
      <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="h-9 w-9 rounded-lg bg-[var(--bg2)]" />
          <div className="h-5 w-40 rounded bg-[var(--bg2)]" />
        </div>
        <div className="p-6 space-y-3">
          <div className="h-4 w-full rounded bg-[var(--bg2)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--bg2)]" />
          <div className="h-4 w-4/6 rounded bg-[var(--bg2)]" />
          <div className="h-4 w-full rounded bg-[var(--bg2)]" />
          <div className="h-4 w-3/4 rounded bg-[var(--bg2)]" />
        </div>
      </div>

      {/* Section skeleton 2 */}
      <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="h-9 w-9 rounded-lg bg-[var(--bg2)]" />
          <div className="h-5 w-36 rounded bg-[var(--bg2)]" />
        </div>
        <div className="p-6 space-y-3">
          <div className="h-4 w-full rounded bg-[var(--bg2)]" />
          <div className="h-4 w-2/3 rounded bg-[var(--bg2)]" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="h-20 rounded-lg bg-[var(--bg2)]" />
            <div className="h-20 rounded-lg bg-[var(--bg2)]" />
            <div className="h-20 rounded-lg bg-[var(--bg2)]" />
            <div className="h-20 rounded-lg bg-[var(--bg2)]" />
          </div>
        </div>
      </div>

      {/* Table skeleton (rubric-like) */}
      <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="h-5 w-48 rounded bg-[var(--bg2)]" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="h-8 rounded bg-[var(--primary-tint)]" />
            <div className="h-8 rounded bg-[var(--primary-tint)]" />
            <div className="h-8 rounded bg-[var(--primary-tint)]" />
            <div className="h-8 rounded bg-[var(--primary-tint)]" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <div className="h-12 rounded bg-[var(--bg2)]" />
              <div className="h-12 rounded bg-[var(--bg2)]" />
              <div className="h-12 rounded bg-[var(--bg2)]" />
              <div className="h-12 rounded bg-[var(--bg2)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Section skeleton 3 */}
      <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="h-9 w-9 rounded-lg bg-[var(--bg2)]" />
          <div className="h-5 w-32 rounded bg-[var(--bg2)]" />
        </div>
        <div className="p-6 space-y-3">
          <div className="h-4 w-full rounded bg-[var(--bg2)]" />
          <div className="h-4 w-4/5 rounded bg-[var(--bg2)]" />
          <div className="h-4 w-full rounded bg-[var(--bg2)]" />
        </div>
      </div>

      {/* Shimmer progress indicator */}
      <div className="flex items-center justify-center gap-2 py-2 text-[var(--muted)] text-sm">
        <div className="h-4 w-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        <span>Generando contenido...</span>
      </div>
    </div>
  );
}
