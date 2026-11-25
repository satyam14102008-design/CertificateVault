import { useMemo } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Cloud,
  Trophy,
} from 'lucide-react';
import { CategoryChart } from '../components/CategoryChart';
import { CertificateCard } from '../components/CertificateCard';
import { StatsCard } from '../components/StatsCard';
import { Badge } from '../components/ui/Badge';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { CertificateCardSkeleton, Skeleton, StatsCardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useCertificates } from '../hooks/useCertificates';
import { formatBytes, formatDisplayDate } from '../utils/formatDate';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const {
    certificates,
    stats,
    loading,
    error,
    refreshAll,
    openAddModal,
    openEditModal,
    openQuickPreview,
    toggleFavorite,
    downloadCertificate,
  } = useCertificates();
  const { onRequestDelete } = useOutletContext();
  const navigate = useNavigate();

  const recentGridCerts = useMemo(() => certificates.slice(0, 6), [certificates]);

  const recentlyAddedCerts = useMemo(() => {
    return [...certificates]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [certificates]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Dashboard</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Track your verified achievements, categories, and private cloud storage at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/certificates"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control text-sm font-medium bg-surface border border-border text-ink-primary hover:bg-slate-50 shadow-card min-h-[44px] sm:min-h-[38px]"
          >
            <span>Browse all</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {error && !loading && (
        <ErrorState message={error} onRetry={() => refreshAll()} />
      )}

      <section aria-label="Certificate summary metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Certificates"
              value={stats?.total ?? certificates.length}
              helper={`${stats?.favorites ?? 0} starred • ${stats?.filesAttachedCount ?? 0} files stored`}
              icon={Award}
              iconBgClass="bg-blue-50 text-brand-blue"
              onClick={() => navigate('/certificates')}
            />
            <StatsCard
              title="Courses"
              value={stats?.courses ?? 0}
              helper="MOOCs & specializations"
              icon={BookOpen}
              iconBgClass="bg-indigo-50 text-indigo-600"
              onClick={() => navigate('/certificates?category=Courses')}
            />
            <StatsCard
              title="Internships"
              value={stats?.internships ?? 0}
              helper="Work experience letters"
              icon={Briefcase}
              iconBgClass="bg-violet-50 text-brand-violet"
              onClick={() => navigate('/certificates?category=Internships')}
            />
            <StatsCard
              title="Hackathons"
              value={stats?.hackathons ?? 0}
              helper="Sprints & finalist awards"
              icon={Trophy}
              iconBgClass="bg-amber-50 text-amber-600"
              onClick={() => navigate('/certificates?category=Hackathons')}
            />
          </>
        )}
      </section>

      {recentlyAddedCerts.length > 0 && (
        <section aria-label="Recently added certificates" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-primary">Recently Added</h2>
            <Link to="/certificates" className="text-xs font-medium text-brand-blue hover:underline inline-flex items-center gap-1">
              <span>All certificates</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {recentlyAddedCerts.map((cert) => (
              <Link
                key={cert.id}
                to={`/certificates/${cert.id}`}
                className="snap-start min-w-[250px] max-w-[280px] shrink-0 bg-surface border border-border rounded-card p-3.5 cv-card-interactive flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge category={cert.category}>{cert.category}</Badge>
                  {cert.issueDate && (
                    <span className="text-[11px] text-ink-muted tabular-nums">
                      {formatDisplayDate(cert.issueDate)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary line-clamp-1">{cert.title}</p>
                  <p className="text-xs text-ink-secondary truncate mt-0.5">
                    {cert.issuer || 'Personal Vault'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          {loading ? (
            <div className="bg-surface border border-border rounded-card p-5 shadow-card h-64 flex flex-col gap-4">
              <Skeleton className="h-5 w-44" />
              <div className="flex-1 flex items-center gap-6">
                <Skeleton className="w-36 h-36 rounded-full shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            </div>
          ) : (
            <CategoryChart
              data={stats?.byCategory || []}
              total={stats?.total ?? certificates.length}
              onSelectCategory={(cat) => navigate(`/certificates?category=${encodeURIComponent(cat)}`)}
            />
          )}
        </div>

        <div className="lg:col-span-4 bg-surface border border-border rounded-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="w-10 h-10 rounded-control bg-blue-50 text-brand-blue flex items-center justify-center">
                <Cloud className="w-5 h-5" aria-hidden="true" />
              </div>
              <Badge tone="success">Private Cloud</Badge>
            </div>
            <h2 className="text-base font-semibold text-ink-primary">Cloud Storage</h2>
            <p className="text-xs text-ink-secondary mt-1">
              Original certificate files stored securely in your private Supabase bucket.
            </p>
          </div>

          <div className="my-5 space-y-1.5">
            <p className="text-2xl font-bold text-ink-primary tabular-nums">
              {formatBytes(stats?.storageUsedBytes || 0)}
            </p>
            <p className="text-xs text-ink-muted">
              Across {stats?.filesAttachedCount ?? 0} attached PDF & image files
            </p>
          </div>

          <Link
            to={isAuthenticated ? '/settings?tab=backup' : '/certificates'}
            className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-control bg-slate-50 hover:bg-slate-100 border border-border text-xs font-medium text-ink-primary transition-colors min-h-[40px] sm:min-h-[36px]"
          >
            <span>{isAuthenticated ? 'Storage & backup export' : 'Browse all certificates'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-label="Recent certificates grid" className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-primary">Your Certificates</h2>
            <p className="text-xs text-ink-secondary">Latest credentials in your personal locker</p>
          </div>
          <Link
            to="/certificates"
            className="text-xs font-medium text-brand-blue hover:underline inline-flex items-center gap-1"
          >
            <span>View all ({certificates.length})</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <CertificateCardSkeleton key={i} />
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState
            title="Your vault is empty"
            description={
              isAuthenticated
                ? 'Add your first certificate PDF, image, or verification link to keep every achievement safe in one place.'
                : 'No certificates have been published yet.'
            }
            actionLabel={isAuthenticated ? 'Add Certificate' : undefined}
            onAction={isAuthenticated ? openAddModal : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentGridCerts.map((cert) => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                onQuickPreview={openQuickPreview}
                onEdit={openEditModal}
                onDelete={onRequestDelete}
                onToggleFavorite={toggleFavorite}
                onDownload={downloadCertificate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
