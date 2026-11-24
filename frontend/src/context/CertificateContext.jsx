import { useCallback, useEffect, useMemo, useState } from 'react';
import * as certificateService from '../services/certificateService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { CertificateContext } from './contexts';

export function CertificateProvider({ children }) {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  const [formModalState, setFormModalState] = useState({ open: false, certificate: null });
  const [quickPreviewCert, setQuickPreviewCert] = useState(null);

  const refreshAll = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated) {
        setCertificates([]);
        setStats(null);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await certificateService.listCertificates({ sort: 'newest', limit: 200 });
        setCertificates(res.items);
        setStats(res.stats);
        setError(null);
      } catch (err) {
        setError(err?.message || 'Failed to load certificates.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const openAddModal = useCallback(() => {
    setFormModalState({ open: true, certificate: null });
  }, []);

  const openEditModal = useCallback((certificate) => {
    setFormModalState({ open: true, certificate });
  }, []);

  const closeFormModal = useCallback(() => {
    setFormModalState({ open: false, certificate: null });
  }, []);

  const openQuickPreview = useCallback((certificate) => {
    setQuickPreviewCert(certificate);
  }, []);

  const closeQuickPreview = useCallback(() => {
    setQuickPreviewCert(null);
  }, []);

  const createCertificate = useCallback(
    async (data, file, onProgress) => {
      const created = await certificateService.createCertificate(data, file, onProgress);
      await refreshAll({ silent: true });
      toast.success('Certificate saved', `"${created.title}" added to your vault.`);
      return created;
    },
    [refreshAll, toast]
  );

  const updateCertificate = useCallback(
    async (id, data, file, onProgress) => {
      const updated = await certificateService.updateCertificate(id, data, file, onProgress);
      await refreshAll({ silent: true });
      if (quickPreviewCert?.id === id) {
        setQuickPreviewCert(updated);
      }
      toast.success('Certificate updated', `"${updated.title}" saved.`);
      return updated;
    },
    [quickPreviewCert?.id, refreshAll, toast]
  );

  const deleteCertificate = useCallback(
    async (certificate) => {
      const targetId = certificate.id;
      const targetTitle = certificate.title;
      try {
        await certificateService.deleteCertificate(targetId);
        setCertificates((prev) => prev.filter((c) => c.id !== targetId));
        if (quickPreviewCert?.id === targetId) {
          setQuickPreviewCert(null);
        }
        await refreshAll({ silent: true });
        toast.success('Certificate deleted', `"${targetTitle}" removed from database and storage.`);
      } catch (err) {
        toast.error('Delete failed', err?.message || 'Could not delete certificate.');
        throw err;
      }
    },
    [quickPreviewCert?.id, refreshAll, toast]
  );

  const toggleFavorite = useCallback(
    async (certificate) => {
      const nextFav = !certificate.isFavorite;
      setCertificates((prev) =>
        prev.map((item) => (item.id === certificate.id ? { ...item, isFavorite: nextFav } : item))
      );
      if (quickPreviewCert?.id === certificate.id) {
        setQuickPreviewCert((prev) => (prev ? { ...prev, isFavorite: nextFav } : null));
      }

      try {
        await certificateService.toggleFavorite(certificate);
        await refreshAll({ silent: true });
        toast.success(
          nextFav ? 'Added to Favorites' : 'Removed from Favorites',
          certificate.title
        );
      } catch (err) {
        await refreshAll({ silent: true });
        toast.error('Update failed', err?.message || 'Could not update favorite status.');
      }
    },
    [quickPreviewCert?.id, refreshAll, toast]
  );

  const downloadCertificate = useCallback(
    async (certificate) => {
      try {
        const result = await certificateService.downloadCertificateFile(certificate);
        toast.success('Download started', result.filename);
      } catch (err) {
        toast.error('Download failed', err?.message || 'Unable to download attached file.');
      }
    },
    [toast]
  );

  const exportAll = useCallback(
    async (format) => {
      try {
        const result = await certificateService.exportCertificates(format);
        toast.success(`Exported ${format.toUpperCase()}`, `Saved ${result.filename}`);
      } catch (err) {
        toast.error('Export failed', err?.message || 'Unable to export certificates.');
      }
    },
    [toast]
  );

  const value = useMemo(
    () => ({
      certificates,
      stats,
      user,
      loading,
      error,
      globalSearch,
      setGlobalSearch,
      formModalState,
      openAddModal,
      openEditModal,
      closeFormModal,
      quickPreviewCert,
      openQuickPreview,
      closeQuickPreview,
      refreshAll,
      createCertificate,
      updateCertificate,
      deleteCertificate,
      toggleFavorite,
      downloadCertificate,
      exportAll,
    }),
    [
      certificates,
      stats,
      user,
      loading,
      error,
      globalSearch,
      formModalState,
      openAddModal,
      openEditModal,
      closeFormModal,
      quickPreviewCert,
      openQuickPreview,
      closeQuickPreview,
      refreshAll,
      createCertificate,
      updateCertificate,
      deleteCertificate,
      toggleFavorite,
      downloadCertificate,
      exportAll,
    ]
  );

  return <CertificateContext.Provider value={value}>{children}</CertificateContext.Provider>;
}
