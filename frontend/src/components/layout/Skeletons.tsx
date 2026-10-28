/** Route-level loading placeholders (shown while a page's code and data load). */

export function GridSkeleton({ cards = 8, withHeader = true }: { cards?: number; withHeader?: boolean }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      {withHeader ? (
        <div className="mb-8 space-y-3">
          <div className="skeleton h-10 w-72 max-w-full rounded-lg" />
          <div className="skeleton h-4 w-96 max-w-full rounded" />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="skeleton h-44 w-full rounded-none" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-5 w-4/5 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-6 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="bg-night pb-12 pt-24">
        <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-40 rounded bg-night-2" />
          <div className="h-12 w-3/4 rounded-xl bg-night-2" />
          <div className="h-4 w-2/3 rounded bg-night-2" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <div className="skeleton h-40 w-full rounded-xl" />
          <div className="skeleton h-72 w-full rounded-xl" />
        </div>
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function PanelSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="skeleton h-9 w-64 max-w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-80 w-full rounded-xl" />
    </div>
  )
}
