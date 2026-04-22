function StatCardSkeleton() {
  return (
    <div className="admin-card rounded-2xl p-5">
      <div className="mb-3 h-9 w-9 rounded-2xl bg-white/[0.06]" />
      <div className="h-7 w-14 rounded bg-white/[0.08]" />
      <div className="mt-2 h-3 w-20 rounded bg-white/[0.05]" />
    </div>
  );
}

function MessageRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-3">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-24 rounded bg-white/[0.08]" />
          <div className="ml-auto h-3 w-16 rounded bg-white/[0.05]" />
        </div>
        <div className="h-3 w-full rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

export default function AdminDashboardLoading() {
  return (
    <div className="max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="h-8 w-40 rounded bg-white/[0.08]" />
        <div className="mt-2 h-4 w-52 rounded bg-white/[0.05]" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-surface rounded-2xl p-5">
          <div className="mb-4 h-4 w-28 rounded bg-white/[0.08]" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-8 w-28 rounded-xl bg-white/[0.05]" />
            ))}
          </div>
        </div>

        <div className="admin-surface rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="h-4 w-28 rounded bg-white/[0.08]" />
            <div className="h-3 w-14 rounded bg-white/[0.05]" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <MessageRowSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
