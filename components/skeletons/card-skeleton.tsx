import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      <Skeleton className="h-32 w-full rounded-xl" />
      {/*<div className="space-y-2">*/}
      {/*  <Skeleton className="h-4 w-[250px]" />*/}
      {/*  <Skeleton className="h-4 w-[200px]" />*/}
      {/*</div>*/}
    </div>
  );
}
