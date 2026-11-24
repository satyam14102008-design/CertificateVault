import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Award,
  ChevronUp,
  FolderKanban,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCertificates } from '../../hooks/useCertificates';
import { Dropdown } from '../ui/Dropdown';

export function BrandLogo() {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="w-9 h-9 rounded-[10px] cv-brand-gradient flex items-center justify-center shadow-sm shrink-0">
        <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <span className="block text-[15px] font-bold tracking-tight text-white font-display truncate">
          CertificateVault
        </span>
        <span className="block text-[11px] text-slate-400 truncate">
          One place for every achievement.
        </span>
      </div>
    </div>
  );
}

function getNavItems(stats, certificates) {
  const totalCount = stats?.total ?? certificates.length;
  const favCount = stats?.favorites ?? certificates.filter((c) => c.isFavorite).length;
  const activeCategories = (stats?.byCategory || []).filter((c) => c.count > 0).length;

  return [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/certificates', label: 'My Certificates', icon: Award, badge: totalCount },
    { to: '/categories', label: 'Categories', icon: FolderKanban, badge: activeCategories || null },
    { to: '/favorites', label: 'Favorites', icon: Star, badge: favCount || null },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];
}

export function SidebarNavContent({ onNavigate }) {
  const { stats, certificates } = useCertificates();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = getNavItems(stats, certificates);

  const userMenuItems = [
    {
      id: 'settings',
      label: 'Vault Settings',
      icon: Settings,
      onClick: () => {
        onNavigate?.();
        navigate('/settings');
      },
    },
    { divider: true },
    {
      id: 'signout',
      label: 'Log out',
      icon: LogOut,
      danger: true,
      onClick: () => {
        onNavigate?.();
        logout();
        navigate('/login', { replace: true });
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-sidebar text-slate-200 select-none">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <NavLink to="/" onClick={onNavigate} className="block rounded-control">
          <BrandLogo />
        </NavLink>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-colors duration-150 min-h-[44px]',
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-indigo-400"
                    />
                  )}
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={clsx(
                        'w-[18px] h-[18px] shrink-0',
                        isActive ? 'text-indigo-300' : 'text-slate-400'
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-pill text-[11px] font-semibold tabular-nums',
                        isActive
                          ? 'bg-indigo-500/30 text-indigo-100'
                          : 'bg-white/10 text-slate-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Dropdown
          align="left"
          widthClass="w-56 bottom-full mb-2 top-auto mt-0"
          items={userMenuItems}
          className="w-full block"
          trigger={({ open }) => (
            <button
              type="button"
              aria-expanded={open}
              aria-label="Vault account menu"
              className="w-full flex items-center gap-3 p-2.5 rounded-control hover:bg-sidebar-hover transition-colors text-left min-h-[48px]"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {user?.label || 'My Vault'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'Private Owner'}
                </p>
              </div>
              <ChevronUp
                className={clsx(
                  'w-4 h-4 text-slate-400 transition-transform shrink-0',
                  open && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>
          )}
        />
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-30 border-r border-slate-900">
      <SidebarNavContent />
    </aside>
  );
}
