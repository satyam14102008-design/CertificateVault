import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-card p-8 sm:p-10 text-center shadow-card max-w-md w-full">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-4">
          <Compass className="w-6 h-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">404 Error</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-primary">Page not found</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          The CertificateVault route you visited does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-control text-sm font-medium cv-brand-gradient text-white shadow-sm min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
