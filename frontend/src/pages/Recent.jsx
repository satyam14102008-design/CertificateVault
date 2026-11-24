import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { CertificateRow } from '../components/CertificateRow';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { CertificateRowSkeleton } from '../components/ui/Skeleton';
import { useCertificates } from '../hooks/useCertificates';
import { formatRelativeTime } from '../utils/formatDate';

export default function Recent() {
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

  const sortedByAdded = useMemo(() => {
    return [...certificates].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [certificates]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Recently Added</h1>
        <p className="text-sm text-ink-secondary mt-0.5">
          Chronological log of credentials added manually or via the Chrome extension.
        </p>
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={() => refreshAll()} />
      ) : loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <CertificateRowSkeleton key={i} />
          ))}
        </div>
      ) : sortedByAdded.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No recently added certificates"
          description="As soon as you upload a certificate or save one from a verification page, it will appear here."
          actionLabel="Add Certificate"
          onAction={openAddModal}
          secondaryActionLabel="Browse My Certificates"
          onSecondaryAction={() => navigate('/certificates')}
        />
      ) : (
        <div className="space-y-2.5">
          {sortedByAdded.map((cert) => (
            <div key={cert.id} className="space-y-1">
              <div className="px-1 flex items-center justify-between text-[11px] font-medium text-ink-muted">
                <span>Added {formatRelativeTime(cert.createdAt)}</span>
              </div>
              <CertificateRow
                certificate={cert}
                onQuickPreview={openQuickPreview}
                onEdit={openEditModal}
                onDelete={onRequestDelete}
                onToggleFavorite={toggleFavorite}
                onDownload={downloadCertificate}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
