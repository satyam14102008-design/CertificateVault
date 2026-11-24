import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Download, Edit3, ExternalLink, Maximize2, Star, Trash2 } from 'lucide-react';
import { useCertificates } from '../../hooks/useCertificates';
import { formatDisplayDate } from '../../utils/formatDate';
import { CertificateModal } from '../CertificateModal';
import { CertificatePreview } from '../CertificatePreview';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Modal } from '../ui/Modal';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const {
    formModalState,
    closeFormModal,
    createCertificate,
    updateCertificate,
    quickPreviewCert,
    closeQuickPreview,
    openEditModal,
    deleteCertificate,
    toggleFavorite,
    downloadCertificate,
  } = useCertificates();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSaveCertificate = async (values, file, onProgress, editingId) => {
    if (editingId) {
      await updateCertificate(editingId, values, file, onProgress);
    } else {
      await createCertificate(values, file, onProgress);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCertificate(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app text-ink-primary flex">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 w-full max-w-page mx-auto px-4 py-5 sm:px-6 sm:py-6">
          <Outlet context={{ onRequestDelete: setDeleteTarget }} />
        </main>
      </div>

      <CertificateModal
        open={formModalState.open}
        certificate={formModalState.certificate}
        onClose={closeFormModal}
        onSave={handleSaveCertificate}
      />

      <Modal
        open={Boolean(quickPreviewCert)}
        onClose={closeQuickPreview}
        title={quickPreviewCert?.title || 'Certificate Preview'}
        subtitle={
          quickPreviewCert
            ? [
                quickPreviewCert.issuer,
                quickPreviewCert.issueDate ? `Issued ${formatDisplayDate(quickPreviewCert.issueDate)}` : '',
              ]
                .filter(Boolean)
                .join(' • ')
            : ''
        }
        size="xl"
        mobileSheet
        footer={
          quickPreviewCert && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleFavorite(quickPreviewCert)}
                >
                  <Star
                    className={
                      quickPreviewCert.isFavorite
                        ? 'w-4 h-4 fill-amber-400 text-amber-500'
                        : 'w-4 h-4'
                    }
                    aria-hidden="true"
                  />
                  <span>{quickPreviewCert.isFavorite ? 'Favorited' : 'Favorite'}</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const target = quickPreviewCert;
                    closeQuickPreview();
                    openEditModal(target);
                  }}
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-semantic-danger hover:bg-red-50"
                  onClick={() => {
                    const target = quickPreviewCert;
                    closeQuickPreview();
                    setDeleteTarget(target);
                  }}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>Delete</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {quickPreviewCert.verificationUrl && (
                  <a
                    href={quickPreviewCert.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium bg-surface border border-border text-ink-primary hover:bg-slate-50 min-h-[36px] sm:min-h-[32px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Verify</span>
                  </a>
                )}
                {quickPreviewCert.file && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadCertificate(quickPreviewCert)}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download</span>
                  </Button>
                )}
                <Link
                  to={`/certificates/${quickPreviewCert.id}`}
                  onClick={closeQuickPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium cv-brand-gradient text-white shadow-sm min-h-[36px] sm:min-h-[32px]"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Full page</span>
                </Link>
              </div>
            </div>
          )
        }
      >
        {quickPreviewCert && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge category={quickPreviewCert.category}>{quickPreviewCert.category}</Badge>
            </div>
            <CertificatePreview
              certificate={quickPreviewCert}
              onDownload={downloadCertificate}
              onEdit={(cert) => {
                closeQuickPreview();
                openEditModal(cert);
              }}
            />
            {quickPreviewCert.description && (
              <p className="text-sm text-ink-secondary leading-relaxed">
                {quickPreviewCert.description}
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete certificate?"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.title}"? Any stored cloud file will also be deleted.`
            : ''
        }
        confirmLabel="Delete certificate"
      />
    </div>
  );
}
