import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-shimmer animate-shimmer rounded-md ${className}`} />
);

export const JobSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-bg-border bg-bg-card p-5">
    <div className="flex items-start gap-4">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  </div>
);
