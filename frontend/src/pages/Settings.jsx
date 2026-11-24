import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useCertificates } from '../hooks/useCertificates';
import { formatBytes } from '../utils/formatDate';

const TABS = [
  { id: 'account', label: 'My Vault', icon: Lock },
  { id: 'backup', label: 'Storage & Backup', icon: HardDrive },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { stats, certificates, exportAll } = useCertificates();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'account';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [exportingFormat, setExportingFormat] = useState('');

  const handleExport = async (format) => {
    setExportingFormat(format);
    try {
      await exportAll(format);
    } finally {
      setExportingFormat('');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Settings</h1>
        <p className="text-sm text-ink-secondary mt-0.5">
          Manage your private vault session, cloud storage footprint, and metadata backups.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-t-control border-b-2 transition-colors whitespace-nowrap min-h-[44px]',
                isActive
                  ? 'border-brand-blue text-brand-blue bg-blue-50/40'
                  : 'border-transparent text-ink-secondary hover:text-ink-primary hover:bg-slate-100/70'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'account' && (
        <section className="bg-surface border border-border rounded-card p-6 shadow-card max-w-2xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-control bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink-primary">My Vault</h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Single-owner private authentication backed by MongoDB Atlas & JWT.
                </p>
              </div>
            </div>
            <Badge tone="success">Authenticated</Badge>
          </div>

          <dl className="divide-y divide-border text-sm">
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-ink-muted">Owner Email</dt>
              <dd className="font-medium text-ink-primary">{user?.email || '—'}</dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-ink-muted">Owner ID</dt>
              <dd className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-ink-primary">
                {user?.id || '—'}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-ink-muted">Total Certificates</dt>
              <dd className="font-medium text-ink-primary tabular-nums">{certificates.length}</dd>
            </div>
          </dl>

          <div className="pt-2 border-t border-border flex justify-end">
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Log out</span>
            </Button>
          </div>
        </section>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-6 max-w-3xl">
          <section className="bg-surface border border-border rounded-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink-primary">Private Cloud Storage</h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Files are stored privately in Supabase Storage and served only to your authenticated session.
                </p>
              </div>
              <Badge tone="success">Private Bucket</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-control bg-slate-50 border border-border p-4">
                <p className="text-xs font-medium text-ink-secondary">Total File Size</p>
                <p className="text-xl font-bold text-ink-primary tabular-nums mt-1">
                  {formatBytes(stats?.storageUsedBytes || 0)}
                </p>
              </div>
              <div className="rounded-control bg-slate-50 border border-border p-4">
                <p className="text-xs font-medium text-ink-secondary">Stored Files</p>
                <p className="text-xl font-bold text-ink-primary tabular-nums mt-1">
                  {stats?.filesAttachedCount ?? 0} files
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-border rounded-card p-6 shadow-card space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink-primary">Export Metadata Backup</h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Download a complete export of your MongoDB certificate records. Original files can also be downloaded individually or in bulk using the backend backup script.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-control border border-border p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-control bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                    <FileJson className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-primary">JSON Backup</p>
                    <p className="text-xs text-ink-muted">Complete schema export</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={exportingFormat === 'json'}
                  onClick={() => handleExport('json')}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Export JSON</span>
                </Button>
              </div>

              <div className="rounded-control border border-border p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-control bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-primary">CSV Spreadsheet</p>
                    <p className="text-xs text-ink-muted">Tabular spreadsheet backup</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={exportingFormat === 'csv'}
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
