export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] p-6">
        <div className="h-5 w-40 rounded-lg fg-skeleton" />
        <div className="mt-3 h-4 w-80 rounded-lg fg-skeleton" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] p-5">
            <div className="h-3 w-16 rounded-lg fg-skeleton" />
            <div className="mt-3 h-7 w-24 rounded-lg fg-skeleton" />
            <div className="mt-3 h-4 w-40 rounded-lg fg-skeleton" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[var(--card)] shadow-[var(--shadow)] p-6">
        <div className="h-4 w-56 rounded-lg fg-skeleton" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl fg-skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}

