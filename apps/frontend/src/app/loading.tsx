export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="border-b border-border-default bg-card/80 h-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-elevated rounded-xl animate-pulse" />
            <div className="w-24 h-6 bg-elevated rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-elevated rounded-lg animate-pulse" />
            <div className="w-32 h-4 bg-elevated rounded animate-pulse hidden sm:block" />
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Hero skeleton */}
        <section className="py-12 sm:py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="h-12 sm:h-14 bg-elevated rounded-lg max-w-lg mx-auto mb-6 animate-pulse" />
            <div className="h-6 bg-elevated rounded-lg max-w-2xl mx-auto mb-3 animate-pulse" />
            <div className="h-6 bg-elevated rounded-lg max-w-xl mx-auto mb-8 animate-pulse" />

            {/* Stats skeleton */}
            <div className="flex justify-center gap-8 mb-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-8 bg-elevated rounded mx-auto mb-2 animate-pulse" />
                  <div className="w-24 h-4 bg-elevated rounded mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload area skeleton */}
        <section className="py-8 px-4">
          <div className="w-full max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-border-strong rounded-2xl p-12">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-elevated rounded-2xl mb-4 animate-pulse" />
                <div className="w-48 h-6 bg-elevated rounded mb-2 animate-pulse" />
                <div className="w-36 h-4 bg-elevated rounded mb-4 animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-16 h-6 bg-elevated rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features skeleton */}
        <section className="py-16 px-4 bg-surface">
          <div className="max-w-6xl mx-auto">
            <div className="h-8 bg-elevated rounded-lg max-w-xs mx-auto mb-8 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center p-4">
                  <div className="w-12 h-12 bg-elevated rounded-xl mx-auto mb-3 animate-pulse" />
                  <div className="w-20 h-5 bg-elevated rounded mx-auto mb-2 animate-pulse" />
                  <div className="w-full h-4 bg-elevated rounded animate-pulse" />
                  <div className="w-3/4 h-4 bg-elevated rounded mx-auto mt-1 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer skeleton */}
      <div className="border-t border-border-default bg-card h-32" />
    </div>
  );
}
