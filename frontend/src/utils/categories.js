export const CATEGORIES = [
  {
    id: 'Courses',
    label: 'Courses',
    description: 'Online specializations, MOOCs, and technical certifications.',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-200/80',
    iconBgClass: 'bg-blue-50 text-blue-600',
    accentBorder: 'border-l-blue-500',
    hex: '#2563EB',
    softHex: '#EFF6FF',
  },
  {
    id: 'Internships',
    label: 'Internships',
    description: 'Industry internships, apprenticeships, and work experience letters.',
    badgeClass: 'bg-violet-50 text-violet-700 ring-violet-200/80',
    iconBgClass: 'bg-violet-50 text-violet-600',
    accentBorder: 'border-l-violet-500',
    hex: '#7C3AED',
    softHex: '#F5F3FF',
  },
  {
    id: 'Hackathons',
    label: 'Hackathons',
    description: 'Hackathon participation, finalist placements, and winning builds.',
    badgeClass: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    iconBgClass: 'bg-amber-50 text-amber-600',
    accentBorder: 'border-l-amber-500',
    hex: '#D97706',
    softHex: '#FFFBEB',
  },
  {
    id: 'Workshops',
    label: 'Workshops',
    description: 'Hands-on bootcamps, developer summits, and live labs.',
    badgeClass: 'bg-teal-50 text-teal-700 ring-teal-200/80',
    iconBgClass: 'bg-teal-50 text-teal-600',
    accentBorder: 'border-l-teal-500',
    hex: '#0D9488',
    softHex: '#F0FDFA',
  },
  {
    id: 'Academic',
    label: 'Academic',
    description: 'University honors, scholarships, and academic distinctions.',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    iconBgClass: 'bg-emerald-50 text-emerald-600',
    accentBorder: 'border-l-emerald-500',
    hex: '#059669',
    softHex: '#ECFDF5',
  },
  {
    id: 'Competitions',
    label: 'Competitions',
    description: 'Coding contests, olympiads, and case competitions.',
    badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    iconBgClass: 'bg-rose-50 text-rose-600',
    accentBorder: 'border-l-rose-500',
    hex: '#E11D48',
    softHex: '#FFF1F2',
  },
  {
    id: 'Other',
    label: 'Other',
    description: 'Community contributions, volunteering, and general credentials.',
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-200/80',
    iconBgClass: 'bg-slate-100 text-slate-600',
    accentBorder: 'border-l-slate-400',
    hex: '#475569',
    softHex: '#F1F5F9',
  },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, cat]));

export function getCategoryMeta(categoryId) {
  return CATEGORY_MAP[categoryId] || CATEGORY_MAP.Other;
}
