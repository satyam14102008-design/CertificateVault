import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, FileX2 } from 'lucide-react';
import { getCertificateFilePreview } from '../services/certificateService';
import { formatBytes } from '../utils/formatDate';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';

export function CertificatePreview({ certificate, onDownload, onEdit }) {
  const [previewState, setPreviewState] = useState({ loading: false, data: null, error: '' });

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    if (!certificate?.file) {
      setPreviewState({ loading: false, data: null, error: '' });
      return undefined;
    }

    setPreviewState({ loading: true, data: null, error: '' });

    getCertificateFilePreview(certificate)
      .then((result) => {
        if (!active) {
          if (result?.url) URL.revokeObjectURL(result.url);
          return;
        }
        createdUrl = result?.url || null;
        setPreviewState({ loading: false, data: result, error: '' });
      })
      .catch((err) => {
        if (!active) return;
        setPreviewState({
          loading: false,
          data: null,
          error: err?.message || 'Unable to load document preview.',
        });
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [certificate]);

  if (!certificate) return null;

  if (!certificate.file) {
    return (
      <div className="bg-slate-50 border border-dashed border-border rounded-card min-h-[360px] lg:min-h-[460px] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-border shadow-card flex items-center justify-center text-ink-muted mb-3">
          <FileX2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-ink-primary">No file attached</h3>
        <p className="text-sm text-ink-secondary mt-1.5 max-w-sm">
          This credential was saved without a PDF or image file.
          {certificate.verificationUrl
            ? ' You can verify it online using the official verification URL.'
            : ' Edit this certificate to attach a PDF, PNG, or JPG.'}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {certificate.verificationUrl && (
            <a
              href={certificate.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-control text-sm font-medium cv-brand-gradient text-white shadow-sm"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span>Open verification link</span>
            </a>
          )}
          {onEdit && (
            <Button variant="secondary" onClick={() => onEdit(certificate)}>
              Attach file
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (previewState.loading) {
    return (
      <div className="bg-surface border border-border rounded-card p-4 min-h-[360px] lg:min-h-[460px] flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="flex-1 w-full rounded-control" />
      </div>
    );
  }

  if (previewState.error || !previewState.data) {
    return (
      <div className="bg-slate-50 border border-border rounded-card min-h-[360px] lg:min-h-[460px] flex flex-col items-center justify-center p-8 text-center">
        <FileText className="w-10 h-10 text-ink-muted mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-ink-primary">
          {previewState.error || 'Document preview unavailable.'}
        </p>
        {onDownload && (
          <Button variant="secondary" className="mt-4" onClick={() => onDownload(certificate)}>
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download file</span>
          </Button>
        )}
      </div>
    );
  }

  const { url, type, name, size } = previewState.data;
  const isPdf = type === 'application/pdf' || name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden shadow-card flex flex-col">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-ink-secondary shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-ink-primary truncate">{name}</span>
          <span className="text-xs text-ink-muted shrink-0">({formatBytes(size)})</span>
        </div>
        {onDownload && (
          <button
            type="button"
            onClick={() => onDownload(certificate)}
            className="text-xs font-medium text-brand-blue hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download</span>
          </button>
        )}
      </div>

      {isPdf ? (
        <div className="bg-slate-100 h-[420px] lg:h-[520px] w-full">
          <object data={url} type="application/pdf" className="w-full h-full">
            <iframe
              src={url}
              title={`${certificate.title} PDF preview`}
              className="w-full h-full border-0"
            />
          </object>
        </div>
      ) : (
        <div className="bg-slate-100/80 p-4 flex items-center justify-center min-h-[340px] lg:min-h-[460px]">
          <img
            src={url}
            alt={certificate.title}
            loading="lazy"
            className="max-h-[480px] w-auto max-w-full rounded-control shadow-sm object-contain bg-white"
          />
        </div>
      )}
    </div>
  );
}
