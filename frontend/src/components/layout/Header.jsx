import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, Lock, LogIn, Menu, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCertificates } from '../../hooks/useCertificates';
import { SearchBar } from '../SearchBar';
import { Button } from '../ui/Button';

export function Header({ onOpenMobileNav }) {
  const { isAuthenticated } = useAuth();
  const { certificates, globalSearch, setGlobalSearch, openAddModal } = useCertificates();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);

  const quickMatches = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q || location.pathname === '/certificates') return [];
    return certificates
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.issuer.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [globalSearch, certificates, location.pathname]);

  const handleSearchSubmit = (query) => {
    const trimmed = query.trim();
    navigate(trimmed ? `/certificates?q=${encodeURIComponent(trimmed)}` : '/certificates');
    setSearchFocused(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="max-w-page mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 -ml-1.5 rounded-control text-ink-secondary hover:text-ink-primary hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="hidden xl:flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-control bg-blue-50 text-brand-blue shrink-0">
              {isAuthenticated ? (
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-primary truncate">
                {isAuthenticated ? 'My Vault' : 'Certificate Portfolio'}
              </p>
              <p className="text-xs text-ink-muted truncate">
                {certificates.length} {certificates.length === 1 ? 'certificate' : 'certificates'}
              </p>
            </div>
          </div>
        </div>

        <div
          className="relative flex-1 max-w-md"
          onFocus={() => setSearchFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setSearchFocused(false);
            }
          }}
        >
          <SearchBar
            value={globalSearch}
            onChange={setGlobalSearch}
            onSubmit={handleSearchSubmit}
            placeholder="Search certificates..."
            enableShortcut
          />

          {searchFocused && quickMatches.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-surface border border-border rounded-card shadow-card-hover py-1.5 z-40">
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Quick jump
              </p>
              {quickMatches.map((cert) => (
                <Link
                  key={cert.id}
                  to={`/certificates/${cert.id}`}
                  onClick={() => setSearchFocused(false)}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="truncate font-medium text-ink-primary">{cert.title}</span>
                  <span className="text-xs text-ink-muted shrink-0">{cert.issuer || cert.category}</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={() => handleSearchSubmit(globalSearch)}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-brand-blue hover:bg-blue-50 border-t border-border mt-1"
              >
                View all results in My Certificates →
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <Button
              variant="primary"
              size="md"
              onClick={openAddModal}
              aria-label="Add Certificate"
              className="px-3 sm:px-4"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Add Certificate</span>
            </Button>
          ) : (
            <Link
              to="/login"
              state={{ from: location }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-control text-sm font-medium bg-surface border border-border text-ink-primary hover:bg-slate-50 shadow-card min-h-[44px] sm:min-h-[38px]"
            >
              <LogIn className="w-4 h-4 shrink-0 text-brand-blue" aria-hidden="true" />
              <span className="hidden sm:inline">Owner Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
