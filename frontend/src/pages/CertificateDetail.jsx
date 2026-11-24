import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowLeft,
  Calendar,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Star,
  Trash2,
} from 'lucide-react';
import { CertificatePreview } from '../components/CertificatePreview';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useCertificates } from '../hooks/useCertificates';
import { getCertificate } from '../services/certificateService';
import { formatBytes, formatDisplayDate, formatRelativeTime } from '../utils/formatDate';

export default function CertificateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    certificates,
    loading: contextLoading,
    openEditModal,
    toggleFavorite,
    downloadCertificate,
  } = useCertificates();
  const { onRequestDelete } = useOutletContext();

  const [fetchedCert, setFetchedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState('');
  const wasInContextRef = useRef(false);

  const liveCert = certificates.find((c) => c.id === id) || fetchedCert;

  useEffect(() => {
    let active = true;
    wasInContextRef.current = false;
    setLoading(true);
    setNotFoundError('');

    getCertificate(id)
      .then((item) => {
        if (!active) return;
        setFetchedCert(item);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setNotFoundError(err?.message || 'Certificate not found.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (contextLoading) return;
    const existsInContext = certificates.some((c) => c.id === id);
    if (existsInContext) {
      wasInContextRef.current = true;
      return;
    }
    if (wasInContextRef.current && !loading) {
      navigate('/certificates', { replace: true });
    }
  }, [certificates, contextLoading, id, loading, navigate]);

  if (loading && !liveCert) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-[460px] rounded-card" />
          <Skeleton className="lg:col-span-5 h-[360px] rounded-card" />
        </div>
      </div>
    );
  }

  if (notFoundError && !liveCert) {
    return (
      <EmptyState
        title="Certificate not found"
        description="This credential may have been deleted or the URL is incorrect."
        actionLabel="Back to My Certificates"
        onAction={() => navigate('/certificates')}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/certificates"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary hover:text-ink-primary transition-colors min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to My Certificates</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => toggleFavorite(liveCert)}>
            <Star
              className={clsx(
                'w-4 h-4',
                liveCert.isFavorite && 'fill-amber-400 text-amber-500'
              )}
              aria-hidden="true"
            />
            <span>{liveCert.isFavorite ? 'Favorited' : 'Favorite'}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEditModal(liveCert)}>
            <Edit3 className="w-4 h-4" aria-hidden="true" />
            <span>Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-semantic-danger hover:bg-red-50"
            onClick={() => onRequestDelete(liveCert)}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <CertificatePreview
            certificate={liveCert}
            onDownload={downloadCertificate}
            onEdit={openEditModal}
          />
        </div>

        <aside className="lg:col-span-5 bg-surface border border-border rounded-card p-5 shadow-card space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge category={liveCert.category}>{liveCert.category}</Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink-primary leading-snug">
              {liveCert.title}
            </h1>
            {liveCert.issuer && (
              <p className="text-sm font-medium text-ink-secondary mt-1">{liveCert.issuer}</p>
            )}
          </div>

          {liveCert.description && (
            <div className="pt-4 border-t border-border">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Description
              </h2>
              <p className="text-sm text-ink-secondary leading-relaxed">{liveCert.description}</p>
            </div>
          )}

          <dl className="pt-4 border-t border-border space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-muted flex items-center gap-2">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>Issue date</span>
              </dt>
              <dd className="font-medium text-ink-primary tabular-nums">
                {formatDisplayDate(liveCert.issueDate)}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-muted flex items-center gap-2">
                <FileText className="w-4 h-4" aria-hidden="true" />
                <span>Attachment</span>
              </dt>
              <dd className="font-medium text-ink-primary truncate max-w-[200px]">
                {liveCert.file
                  ? `${liveCert.file.name} (${formatBytes(liveCert.file.size)})`
                  : 'None attached'}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-muted">Last updated</dt>
              <dd className="text-xs font-medium text-ink-secondary">
                {formatRelativeTime(liveCert.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="pt-4 border-t border-border flex flex-col gap-2.5">
            {liveCert.verificationUrl && (
              <a
                href={liveCert.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control text-sm font-medium cv-brand-gradient text-white shadow-sm min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                <span>Open verification link</span>
              </a>
            )}

            {liveCert.file && (
              <Button
                variant={liveCert.verificationUrl ? 'secondary' : 'primary'}
                className="w-full"
                onClick={() => downloadCertificate(liveCert)}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download original file</span>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
