/**
 * Skeleton Loader — animated placeholder during data fetching
 */

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
  );
}

/**
 * Token Card Skeleton — placeholder for the main token display
 */
export function TokenCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
      <Skeleton className="h-4 w-16 mx-auto mb-4" />
      <Skeleton className="h-24 w-36 mx-auto mb-4" />
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  );
}

/**
 * Queue Info Skeleton — placeholder for the queue stats
 */
export function QueueInfoSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 space-y-3 shadow-sm">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          {i < 3 && <div className="h-px bg-gray-100 mt-3" />}
        </div>
      ))}
    </div>
  );
}
