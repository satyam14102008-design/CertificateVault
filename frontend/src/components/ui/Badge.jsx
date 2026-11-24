import clsx from 'clsx';
import { getCategoryMeta } from '../../utils/categories';

const TONE_CLASSES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200/80',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/80',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  danger: 'bg-red-50 text-red-700 ring-red-200/80',
};

export function Badge({ children, tone = 'neutral', category, className = '', icon: Icon }) {
  const toneClass = category ? getCategoryMeta(category).badgeClass : TONE_CLASSES[tone] || TONE_CLASSES.neutral;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        toneClass,
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
