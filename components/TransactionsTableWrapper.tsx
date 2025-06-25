'use client';

import { useEffect, useState } from 'react';
import { TransactionsTable } from './TransactionsTable';
import { Skeleton } from '@/components/ui/skeleton';

// Hydration-safe wrapper to prevent SSR/client mismatches
export function TransactionsTableWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show skeleton during SSR and initial hydration
  if (!isClient) {
    return (
      <div className="w-full space-y-3 mt-8 px-4">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between py-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        {/* Skeleton Table Body */}
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex w-full space-x-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        {/* Skeleton Footer */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  // Render actual table only after hydration
  return <TransactionsTable />;
} 