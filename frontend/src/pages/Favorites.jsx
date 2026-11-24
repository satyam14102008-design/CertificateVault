import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Star } from 'lucide-react';
import { CertificateCard } from '../components/CertificateCard';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { CertificateCardSkeleton } from '../components/ui/Skeleton';
import { useCertificates } from '../hooks/useCertificates';

export default function Favorites() {
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
  const navigate = useNavigate();

  const favoriteCerts = useMemo(
    () => certificates.filter((c) => c.isFavorite),
    [certificates]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Favorites</h1>
        <p className="text-sm text-ink-secondary mt-0.5">
          Starred achievements kept pinned for resumes, interviews, and portfolio reviews.
        </p>
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={() => refreshAll()} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <CertificateCardSkeleton key={i} />
          ))}
        </div>
      ) : favoriteCerts.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No favorite certificates yet"
          description="Click the star icon on any certificate card to pin your standout credentials here."
          actionLabel="Browse My Certificates"
          onAction={() => navigate('/certificates')}
          secondaryActionLabel="Add Certificate"
          onSecondaryAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favoriteCerts.map((cert) => (
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
    </div>
  );
}
