export default function CatalogLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Title header skeleton */}
      <div className="border-b border-muted-zinc/60 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-2.5 w-32 bg-muted-zinc/30 rounded animate-pulse" />
          <div className="h-10 w-72 bg-muted-zinc/30 rounded animate-pulse" />
        </div>
        <div className="h-9 w-48 bg-muted-zinc/20 rounded-md animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="sticky top-16 bg-warm-linen pt-4 pb-3 border-b border-muted-zinc/40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 bg-muted-zinc/20 rounded animate-pulse" />
            <div className="h-6 w-16 bg-muted-zinc/20 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="h-6 w-32 bg-muted-zinc/20 rounded animate-pulse" />
            <div className="h-8 w-52 bg-muted-zinc/20 rounded-md animate-pulse" />
            <div className="h-8 w-32 bg-muted-zinc/20 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Grid layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="space-y-3">
            <div className="h-2 w-16 bg-muted-zinc/30 rounded animate-pulse" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-muted-zinc/20 rounded animate-pulse w-3/4" />
            ))}
          </div>
          <div className="space-y-3 pt-4 border-t border-muted-zinc/30">
            <div className="h-2 w-20 bg-muted-zinc/30 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-muted-zinc/20 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </aside>

        {/* Cards skeleton grid */}
        <section className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-full flex">
                <div className="bg-surface-white border border-muted-zinc rounded-xl flex flex-row gap-4 p-4 h-36 items-center sm:flex-col sm:h-[400px] sm:p-6 w-full animate-pulse">
                  <div className="bg-muted-zinc/30 rounded-lg h-28 w-28 shrink-0 sm:w-full sm:flex-1 sm:min-h-[180px]" />
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full sm:h-auto sm:w-full space-y-2">
                    <div className="space-y-2">
                      <div className="h-2 bg-muted-zinc/30 rounded w-3/4" />
                      <div className="h-3.5 bg-muted-zinc/40 rounded w-full" />
                      <div className="h-2 bg-muted-zinc/20 rounded w-1/2" />
                      <div className="hidden sm:block h-5 bg-muted-zinc/20 rounded w-24 mt-2" />
                    </div>
                    <div className="h-4 bg-muted-zinc/30 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
