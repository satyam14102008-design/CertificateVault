import clsx from 'clsx';

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={clsx('cv-skeleton rounded-control', className)} />;
}

export function CertificateCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-card p-4 shadow-card space-y-3">
      <Skeleton className="h-36 w-full rounded-control" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-20 rounded-pill" />
        <Skeleton className="h-5 w-16 rounded-pill" />
      </div>
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3.5 w-1/2" />
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-card p-5 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-control" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function CertificateRowSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-card px-4 py-3.5 flex items-center gap-4">
      <Skeleton className="h-11 w-14 rounded-control shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-6 w-20 rounded-pill hidden sm:block" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}
