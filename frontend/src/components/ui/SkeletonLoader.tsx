interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
}

export function SkeletonLine({ height = 'h-4', className = '' }: { height?: string; className?: string }) {
  return (
    <div className={`${height} bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4 animate-pulse">
      <SkeletonLine height="h-6" className="w-3/4" />
      <SkeletonLine height="h-4" className="w-full" />
      <SkeletonLine height="h-4" className="w-5/6" />
      <div className="flex gap-4 mt-6">
        <SkeletonLine height="h-10" className="w-24" />
        <SkeletonLine height="h-10" className="w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <SkeletonLine height="h-8" className="w-1/3" />
      </div>
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            <SkeletonLine height="h-6" className="w-1/4" />
            <SkeletonLine height="h-6" className="w-1/4" />
            <SkeletonLine height="h-6" className="w-1/4" />
            <SkeletonLine height="h-6" className="w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkeletonLoader({ count = 3, height = 'h-4', className = '' }: SkeletonLoaderProps) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <SkeletonLine key={i} height={height} className={className} />
      ))}
    </div>
  );
}
