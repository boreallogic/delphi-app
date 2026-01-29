import { Skeleton, IndicatorCardSkeleton } from '@/components/ui/skeleton'

export default function StudyLoading() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-96 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {/* Domain tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-32 flex-shrink-0" />
        ))}
      </div>

      {/* Indicator card */}
      <IndicatorCardSkeleton />
    </div>
  )
}
