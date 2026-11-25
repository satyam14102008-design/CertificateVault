import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Code2,
  GraduationCap,
  Layers,
  Trophy,
  Wrench,
} from 'lucide-react';
import { CertificateCard } from '../components/CertificateCard';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { CertificateCardSkeleton, Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useCertificates } from '../hooks/useCertificates';
import { CATEGORIES } from '../utils/categories';

const CATEGORY_ICONS = {
  Courses: BookOpen,
  Internships: Briefcase,
  Hackathons: Code2,
  Workshops: Wrench,
  Academic: GraduationCap,
  Competitions: Trophy,
  Other: Layers,
};

export default function Categories() {
  const { isAuthenticated } = useAuth();
  const {
    certificates,
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

  const [selectedCategory, setSelectedCategory] = useState(null);

  const countsByCategory = useMemo(() => {
    const map = {};
    for (const cat of CATEGORIES) map[cat.id] = 0;
    for (const cert of certificates) {
      map[cert.category] = (map[cert.category] || 0) + 1;
    }
    return map;
  }, [certificates]);

  const filteredCerts = useMemo(() => {
    if (!selectedCategory) return [];
    return certificates.filter((c) => c.category === selectedCategory);
  }, [certificates, selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Categories</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Explore your achievements organized by credential type. Click a category to filter.
          </p>
        </div>
        {selectedCategory && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedCategory(null)}>
              Clear selection
            </Button>
            <Link
              to={`/certificates?category=${encodeURIComponent(selectedCategory)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium cv-brand-gradient text-white min-h-[36px] sm:min-h-[32px]"
            >
              <span>Open in My Certificates</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={() => refreshAll()} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-card p-5 space-y-3">
              <Skeleton className="h-10 w-10 rounded-control" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Award;
            const count = countsByCategory[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                aria-pressed={isSelected}
                className={clsx(
                  'bg-surface border rounded-card p-5 text-left cv-card-interactive border-l-4 transition-all',
                  cat.accentBorder,
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20'
                    : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={clsx('w-10 h-10 rounded-control flex items-center justify-center', cat.iconBgClass)}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span className="text-xl font-bold text-ink-primary tabular-nums">{count}</span>
                </div>
                <h2 className="mt-3.5 text-base font-semibold text-ink-primary">{cat.label}</h2>
                <p className="mt-1 text-xs text-ink-secondary leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selectedCategory && !loading && (
        <section aria-label={`${selectedCategory} certificates`} className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-primary">
              {selectedCategory} ({filteredCerts.length})
            </h2>
          </div>

          {filteredCerts.length === 0 ? (
            <EmptyState
              title={`No ${selectedCategory} certificates yet`}
              description={
                isAuthenticated
                  ? `Add a credential under ${selectedCategory} to see it listed here.`
                  : `No credentials have been published under ${selectedCategory} yet.`
              }
              actionLabel={isAuthenticated ? 'Add Certificate' : undefined}
              onAction={isAuthenticated ? openAddModal : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCerts.map((cert) => (
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
      )}

      {loading && selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <CertificateCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
