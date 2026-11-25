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
import { formatBytes, formatDisplayDate } from '../utils/formatDate';
import { Badge } from './ui/Badge';
import { Dropdown } from './ui/Dropdown';
import { Tooltip } from './ui/Tooltip';

export const CertificateCard = memo(function CertificateCard({
  certificate,
  onQuickPreview,
  onEdit,
  onDelete,
  onToggleFavorite,
  onDownload,
}) {
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
    { divider: true },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: () => onDelete?.(certificate),
    },
  ];

  return (
    <article className="bg-surface border border-border rounded-card cv-card-interactive flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] bg-slate-50 border-b border-border overflow-hidden group">
        <button
          type="button"
          onClick={() => onQuickPreview?.(certificate)}
          aria-label={`Quick preview ${certificate.title}`}
          className="w-full h-full block text-left"
        >
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={`${certificate.title} preview`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : hasFile ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center transition-transform duration-200 group-hover:scale-[1.02]">
              <div
                className={clsx(
                  'w-12 h-12 rounded-2xl border flex items-center justify-center mb-2.5',
                  isPdf
                    ? 'bg-red-50 text-semantic-danger border-red-100'
                    : 'bg-blue-50 text-brand-blue border-blue-100'
                )}
              >
                {isPdf ? (
                  <FileText className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <ImageIcon className="w-6 h-6" aria-hidden="true" />
                )}
              </div>
              <span className="text-xs font-medium text-ink-primary truncate max-w-[90%]">
                {certificate.file.name}
              </span>
              <span className="text-[11px] text-ink-muted mt-0.5">
                {isPdf ? 'PDF' : 'Image'} • {formatBytes(certificate.file.size)}
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-xs font-medium text-ink-secondary">
                {hasUrl ? 'Verification link saved' : 'Metadata record'}
              </span>
            </div>
          )}
        </button>

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <Tooltip content={certificate.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}>
            <button
              type="button"
              onClick={() => onToggleFavorite?.(certificate)}
              aria-label={certificate.isFavorite ? `Unfavorite ${certificate.title}` : `Favorite ${certificate.title}`}
              aria-pressed={certificate.isFavorite}
              className={clsx(
                'w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm border transition-colors',
                certificate.isFavorite
                  ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                  : 'bg-white/95 border-border text-ink-muted hover:text-amber-500 hover:bg-white'
              )}
            >
              <Star
                className={clsx('w-4 h-4', certificate.isFavorite && 'fill-amber-400 text-amber-500')}
                aria-hidden="true"
              />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge category={certificate.category}>{certificate.category}</Badge>
          {certificate.issueDate && (
            <span className="text-xs text-ink-muted tabular-nums">
              {formatDisplayDate(certificate.issueDate)}
            </span>
          )}
        </div>

        <Link
          to={`/certificates/${certificate.id}`}
          className="text-sm font-semibold text-ink-primary hover:text-brand-blue transition-colors line-clamp-2 leading-snug"
        >
          {certificate.title}
        </Link>
        <p className="text-xs font-medium text-ink-secondary mt-1 truncate">
          {certificate.issuer || 'Personal Vault'}
        </p>

        <div className="mt-auto pt-3.5 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/certificates/${certificate.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium bg-slate-100 text-ink-primary hover:bg-slate-200/80 transition-colors min-h-[36px] sm:min-h-[30px]"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>View</span>
            </Link>

            {hasFile && (
              <button
                type="button"
                onClick={() => onDownload?.(certificate)}
                aria-label={`Download ${certificate.title}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition-colors min-h-[36px] sm:min-h-[30px]"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Download</span>
              </button>
            )}

            {hasUrl && (
              <a
                href={certificate.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium text-ink-secondary hover:text-brand-blue hover:bg-blue-50 transition-colors min-h-[36px] sm:min-h-[30px]"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verify</span>
              </a>
            )}
          </div>

          <Dropdown
            items={menuItems}
            trigger={({ open }) => (
              <button
                type="button"
                aria-label={`More actions for ${certificate.title}`}
                aria-expanded={open}
                className="p-1.5 rounded-control text-ink-muted hover:text-ink-primary hover:bg-slate-100 transition-colors min-h-[36px] min-w-[36px] sm:min-h-[30px] sm:min-w-[30px] flex items-center justify-center"
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
