import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonTable() {
  return (
    <div className="flex items-center justify-center px-4 mt-24  flex-col space-y-3">
      {/* Render 10 skeleton rows */}
  {Array.from({ length: 10 }).map((_, index) => (
    <div key={index} className="flex space-x-3">
    {/* Render a skeleton cell for each of the 5 columns */}
    <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[200px]" />
    </div>
  ))}
  </div>
)
}