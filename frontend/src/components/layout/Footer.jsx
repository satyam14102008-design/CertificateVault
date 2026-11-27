import { ExternalLink, ShieldCheck } from 'lucide-react';

const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    href: 'https://github.com/satyam14102008-design',
    ariaLabel: 'Visit Satyam Rai on GitHub',
    hoverClass: 'hover:border-slate-400 hover:bg-slate-100/80 hover:text-ink-primary',
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/satyam-rai-65a298386/',
    ariaLabel: 'Visit Satyam Rai on LinkedIn',
    hoverClass: 'hover:border-blue-300 hover:bg-blue-50/70 hover:text-brand-blue',
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-page mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-secondary">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md cv-brand-gradient text-white shadow-sm shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="font-semibold text-ink-primary">CertificateVault</span>
          <span className="text-ink-muted" aria-hidden="true">•</span>
          <span className="text-ink-muted">Satyam Rai</span>
        </div>

        <nav aria-label="Profile links" className="flex items-center gap-2.5">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.ariaLabel}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium bg-surface border border-border text-ink-secondary shadow-card transition-colors min-h-[38px] sm:min-h-[34px] ${item.hoverClass}`}
            >
              {item.icon}
              <span>{item.name}</span>
              <ExternalLink className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
