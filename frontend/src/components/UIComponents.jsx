export function SkeletonCard() {
  return (
    <div className="card p-6">
      <div className="flex gap-4">
        <div className="w-16 h-20 skeleton rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton w-3/4 rounded" />
          <div className="h-3 skeleton w-1/2 rounded" />
          <div className="h-3 skeleton w-1/4 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 skeleton rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton w-1/3 rounded" />
            <div className="h-3 skeleton w-1/4 rounded" />
          </div>
          <div className="h-8 w-20 skeleton rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-md">{message}</p>
      {action}
    </div>
  );
}
