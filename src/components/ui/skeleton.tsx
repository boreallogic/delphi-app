import { cn } from '@/lib/utils'

/**
 * Skeleton Component
 *
 * Animated loading placeholder for content that is being fetched.
 * Use while data is loading to provide visual feedback to users.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      {...props}
    />
  )
}

/**
 * Card Skeleton
 * Pre-configured skeleton for card layouts
 */
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

/**
 * Table Skeleton
 * Pre-configured skeleton for table rows
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-4">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

/**
 * Indicator Card Skeleton
 * Skeleton specifically for indicator cards
 */
export function IndicatorCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-6 w-full" />
      </div>

      {/* Definition */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Rating scales */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>

      {/* Textarea */}
      <Skeleton className="h-32 w-full" />

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
