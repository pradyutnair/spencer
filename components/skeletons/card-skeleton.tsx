import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="rounded-xl h-32 w-full" />
      {/*<div className="space-y-2">*/}
      {/*  <Skeleton className="h-4 w-[250px]" />*/}
      {/*  <Skeleton className="h-4 w-[200px]" />*/}
      {/*</div>*/}
    </div>
  )
}
