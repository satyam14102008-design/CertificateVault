import clsx from 'clsx';
import { LayoutGrid, List } from 'lucide-react';

export function ViewToggle({ view, onChange }) {
  return (
    <div
      role="group"
      aria-label="Certificate layout view"
      className="inline-flex items-center rounded-control bg-surface border border-border p-1 shadow-card shrink-0"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs font-medium transition-colors min-h-[36px] sm:min-h-[30px]',
          view === 'grid'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-100'
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-label="List view"
        aria-pressed={view === 'list'}
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs font-medium transition-colors min-h-[36px] sm:min-h-[30px]',
          view === 'list'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-100'
        )}
      >
        <List className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
