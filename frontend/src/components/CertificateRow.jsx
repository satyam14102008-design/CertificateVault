import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import { getCachedImageThumbnailUrl } from '../services/certificateService';
import { useAuth } from '../hooks/useAuth';
import { formatDisplayDate } from '../utils/formatDate';
import { Badge } from './ui/Badge';
import { Dropdown } from './ui/Dropdown';

export const CertificateRow = memo(function CertificateRow({
  certificate,
  onQuickPreview,
  onEdit,
  onDelete,
  onToggleFavorite,
  onDownload,
}) {
  const { isAuthenticated } = useAuth();
  const isPdf = certificate.file?.type === 'application/pdf';
  const isImage = Boolean(certificate.file?.type?.startsWith('image/'));
  const hasPreviewableFile = isImage || isPdf;
  const hasFile = Boolean(certificate.file);
  const hasUrl = Boolean(certificate.verificationUrl);

  const [thumbUrl, setThumbUrl] = useState(null);

  useEffect(() => {
    let active = true;
    if (!hasPreviewableFile) {
      setThumbUrl(null);
      return undefined;
    }

    getCachedImageThumbnailUrl(certificate)
      .then((url) => {
        if (active) setThumbUrl(url);
      })
      .catch(() => {
        if (active) setThumbUrl(null);
      });

    return () => {
      active = false;
    };
  }, [certificate, hasPreviewableFile]);

  const menuItems = [
    {
      id: 'quick-preview',
      label: 'Quick preview',
      icon: Eye,
      onClick: () => onQuickPreview?.(certificate),
    },
    ...(hasUrl
      ? [
          {
            id: 'open-link',
            label: 'Open original link',
            icon: ExternalLink,
            onClick: () => window.open(certificate.verificationUrl, '_blank', 'noopener,noreferrer'),
          },
        ]
      : []),
    ...(isAuthenticated
      ? [
          {
            id: 'edit',
            label: 'Edit details',
            icon: Edit3,
            onClick: () => onEdit?.(certificate),
          },
          {
            id: 'favorite',
            label: certificate.isFavorite ? 'Remove favorite' : 'Add to favorites',
            icon: Star,
            onClick: () => onToggleFavorite?.(certificate),
          },
          { divider: true },
          {
            id: 'delete',
            label: 'Delete',
            icon: Trash2,
            danger: true,
            onClick: () => onDelete?.(certificate),
          },
        ]
      : []),
  ];

  return (
    <article className="bg-surface border border-border rounded-card px-4 py-3 cv-card-interactive flex flex-col sm:flex-row sm:items-center gap-3.5">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onQuickPreview?.(certificate)}
          aria-label={`Quick preview ${certificate.title}`}
          className="w-16 h-12 rounded-control border border-border bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center"
        >
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={`${certificate.title} thumbnail`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : hasFile ? (
            isPdf ? (
              <FileText className="w-5 h-5 text-semantic-danger" aria-hidden="true" />
            ) : (
              <ImageIcon className="w-5 h-5 text-brand-blue" aria-hidden="true" />
            )
          ) : (
            <ShieldCheck className="w-5 h-5 text-brand-blue" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <Link
            to={`/certificates/${certificate.id}`}
            className="text-sm font-semibold text-ink-primary hover:text-brand-blue transition-colors truncate block"
          >
            {certificate.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-ink-secondary">
            <span className="font-medium">{certificate.issuer || 'Personal Vault'}</span>
            {certificate.issueDate && (
              <>
                <span aria-hidden="true" className="text-ink-muted">•</span>
                <span className="tabular-nums text-ink-muted">{formatDisplayDate(certificate.issueDate)}</span>
              </>
            )}
            {certificate.file && (
              <>
                <span aria-hidden="true" className="text-ink-muted hidden md:inline">•</span>
                <span className="text-ink-muted hidden md:inline truncate max-w-[180px]">
                  {certificate.file.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0">
        <Badge category={certificate.category}>{certificate.category}</Badge>

        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => onToggleFavorite?.(certificate)}
              aria-label={certificate.isFavorite ? `Unfavorite ${certificate.title}` : `Favorite ${certificate.title}`}
              aria-pressed={certificate.isFavorite}
              className="p-2 rounded-control text-ink-muted hover:text-amber-500 hover:bg-amber-50 transition-colors min-h-[40px] min-w-[40px] sm:min-h-[34px] sm:min-w-[34px] flex items-center justify-center"
            >
              <Star
                className={clsx('w-4 h-4', certificate.isFavorite && 'fill-amber-400 text-amber-500')}
                aria-hidden="true"
              />
            </button>
          )}

          <Link
            to={`/certificates/${certificate.id}`}
            aria-label={`View ${certificate.title}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium bg-slate-100 text-ink-primary hover:bg-slate-200/80 transition-colors min-h-[40px] sm:min-h-[32px]"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>View</span>
          </Link>

          {hasFile && (
            <button
              type="button"
              onClick={() => onDownload?.(certificate)}
              aria-label={`Download ${certificate.title}`}
              className="p-2 rounded-control text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] sm:min-h-[34px] sm:min-w-[34px] flex items-center justify-center"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          <Dropdown
            items={menuItems}
            trigger={({ open }) => (
              <button
                type="button"
                aria-label={`More actions for ${certificate.title}`}
                aria-expanded={open}
                className="p-2 rounded-control text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] sm:min-h-[34px] sm:min-w-[34px] flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          />
        </div>
      </div>
    </article>
  );
});
