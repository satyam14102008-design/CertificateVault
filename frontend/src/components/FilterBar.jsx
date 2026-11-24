import { X } from 'lucide-react';
import { CATEGORIES } from '../utils/categories';
import { Select } from './ui/Select';
import { SearchBar } from './SearchBar';
import { ViewToggle } from './ViewToggle';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
];

export function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  issuer,
  onIssuerChange,
  issuers = [],
  sort,
  onSortChange,
  view,
  onViewChange,
  resultCount,
  totalCount,
  onClearAll,
}) {
  const categoryOptions = [
    { value: 'All', label: 'All categories' },
    ...CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
  ];

  const issuerOptions = [
    { value: 'All', label: 'All issuers' },
    ...issuers.map((name) => ({ value: name, label: name })),
  ];

  const activeChips = [];
  if (search.trim()) {
    activeChips.push({
      key: 'search',
      label: `Search: "${search.trim()}"`,
      onRemove: () => onSearchChange(''),
    });
  }
  if (category && category !== 'All') {
    activeChips.push({
      key: 'category',
      label: `Category: ${category}`,
      onRemove: () => onCategoryChange('All'),
    });
  }
  if (issuer && issuer !== 'All') {
    activeChips.push({
      key: 'issuer',
      label: `Issuer: ${issuer}`,
      onRemove: () => onIssuerChange('All'),
    });
  }

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-border rounded-card p-3.5 shadow-card flex flex-col lg:flex-row lg:items-center gap-3">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Filter by title, issuer, or description..."
          className="flex-1 min-w-0"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2.5">
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={categoryOptions}
            className="lg:w-44"
          />
          <Select
            aria-label="Filter by issuer"
            value={issuer}
            onChange={(e) => onIssuerChange(e.target.value)}
            options={issuerOptions}
            className="lg:w-44"
          />
          <Select
            aria-label="Sort certificates"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            options={SORT_OPTIONS}
            className="lg:w-40"
          />
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 pt-1 lg:pt-0 border-t lg:border-t-0 border-border">
          <span className="text-xs font-medium text-ink-secondary lg:hidden">
            {resultCount} of {totalCount} shown
          </span>
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 min-h-[24px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-secondary">
            Showing <span className="text-ink-primary font-semibold tabular-nums">{resultCount}</span>{' '}
            {resultCount === 1 ? 'certificate' : 'certificates'}
            {totalCount !== resultCount && (
              <span className="text-ink-muted"> (of {totalCount} total)</span>
            )}
          </span>

          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-pill bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 px-2.5 py-0.5 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          ))}
        </div>

        {activeChips.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-brand-blue hover:text-blue-700 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
