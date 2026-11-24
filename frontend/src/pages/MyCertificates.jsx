import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Award, SearchX } from 'lucide-react';
import { CertificateCard } from '../components/CertificateCard';
import { CertificateRow } from '../components/CertificateRow';
import { FilterBar } from '../components/FilterBar';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { CertificateCardSkeleton, CertificateRowSkeleton } from '../components/ui/Skeleton';
import { useCertificates } from '../hooks/useCertificates';
import { useDebounce } from '../hooks/useDebounce';
import { getViewPreference, setViewPreference } from '../services/certificateService';

export default function MyCertificates() {
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
    globalSearch,
    setGlobalSearch,
  } = useCertificates();
  const { onRequestDelete } = useOutletContext();

  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') || 'All';
  const issuer = searchParams.get('issuer') || 'All';
  const sort = searchParams.get('sort') || 'newest';
  const urlQuery = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [view, setView] = useState(() => getViewPreference());
  const debouncedSearch = useDebounce(searchInput, 180);
  const lastWrittenQRef = useRef(urlQuery);

  // Sync only when URL query parameter changes externally (e.g. header search submit or browser back/forward)
  useEffect(() => {
    if (urlQuery !== lastWrittenQRef.current) {
      lastWrittenQRef.current = urlQuery;
      setSearchInput(urlQuery);
    }
  }, [urlQuery]);

  // Mirror header search bar live when user types in it on this page
  useEffect(() => {
    if (globalSearch !== searchInput && globalSearch !== '') {
      setSearchInput(globalSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch]);

  const updateParam = useCallback(
    (key, value, defaultValue = '') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value === defaultValue) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Sync debounced search input to ?q= without clobbering other query params
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === lastWrittenQRef.current) return;
    lastWrittenQRef.current = trimmed;
    updateParam('q', trimmed, '');
  }, [debouncedSearch, updateParam]);

  const handleViewChange = (nextView) => {
    setView(nextView);
    setViewPreference(nextView);
  };

  const handleClearFilters = () => {
    lastWrittenQRef.current = '';
    setSearchInput('');
    setGlobalSearch('');
    setSearchParams({}, { replace: true });
  };

  const issuersList = useMemo(() => {
    if (stats?.issuers?.length) return stats.issuers;
    return Array.from(new Set(certificates.map((c) => c.issuer))).sort((a, b) => a.localeCompare(b));
  }, [stats?.issuers, certificates]);

  const filteredCertificates = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = [...certificates];

    if (category !== 'All') {
      list = list.filter((c) => c.category === category);
    }
    if (issuer !== 'All') {
      list = list.filter((c) => c.issuer === issuer);
    }
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.issuer.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
      }
      if (sort === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sort === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      const dateDiff = new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [certificates, debouncedSearch, category, issuer, sort]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">My Certificates</h1>
        <p className="text-sm text-ink-secondary mt-0.5">
          Search, filter, preview, and download every credential in your vault.
        </p>
      </div>

      <FilterBar
        search={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setGlobalSearch(val);
        }}
        category={category}
        onCategoryChange={(val) => updateParam('category', val, 'All')}
        issuer={issuer}
        onIssuerChange={(val) => updateParam('issuer', val, 'All')}
        issuers={issuersList}
        sort={sort}
        onSortChange={(val) => updateParam('sort', val, 'newest')}
        view={view}
        onViewChange={handleViewChange}
        resultCount={filteredCertificates.length}
        totalCount={certificates.length}
        onClearAll={handleClearFilters}
      />

      {error && !loading ? (
        <ErrorState message={error} onRetry={() => refreshAll()} />
      ) : loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CertificateCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <CertificateRowSkeleton key={i} />
            ))}
          </div>
        )
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Upload a PDF or image certificate, or add a credential with its verification URL."
          actionLabel="Add your first certificate"
          onAction={openAddModal}
        />
      ) : filteredCertificates.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching certificates"
          description="Try adjusting your search query or clearing active category and issuer filters."
          actionLabel="Clear all filters"
          onAction={handleClearFilters}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCertificates.map((cert) => (
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
      ) : (
        <div className="space-y-2.5">
          {filteredCertificates.map((cert) => (
            <CertificateRow
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
