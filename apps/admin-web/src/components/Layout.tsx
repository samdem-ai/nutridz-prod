import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, House, LogOut, Moon, Package, ScanBarcode, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n, type Lang } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(() => {
    try {
      return (localStorage.getItem('nutridz_admin_theme') as 'light' | 'dark' | null) ?? null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    try {
      if (theme) localStorage.setItem('nutridz_admin_theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const isDark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}

export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return <img src="/icon.png" alt="" className={`${className} rounded-xl`} />;
}

export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="flex rounded-md border border-line p-0.5" role="group" aria-label={t('language')}>
      {(['fr', 'en', 'ar'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`min-h-7 rounded px-2 text-[12px] font-medium uppercase ${lang === l ? 'bg-surface-2 text-ink' : 'text-ink-3'}`}
          aria-pressed={lang === l}
        >
          {l === 'ar' ? 'ع' : l}
        </button>
      ))}
    </div>
  );
}

export function Layout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: api.stats, refetchInterval: 60_000 });
  const pending = stats?.pending ?? 0;

  const items = [
    { to: '/', label: t('navHome'), icon: House, end: true },
    { to: '/review', label: t('navReview'), icon: ClipboardCheck, badge: pending },
    { to: '/scan', label: t('navScan'), icon: ScanBarcode, primary: true },
    { to: '/products', label: t('navProducts'), icon: Package },
  ];

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-line bg-surface p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <BrandMark className="size-8" />
          <div>
            <p className="font-semibold leading-tight">NutriDz</p>
            <p className="text-[12px] font-semibold text-ink-3">Admin</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {[items[2], items[0], items[1], items[3]].map(({ to, label, icon: Icon, end, badge, primary }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                  primary ? 'mb-3 bg-brand text-white hover:bg-brand-600' : isActive ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2'
                }`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {!!badge && <span className="rounded bg-accent px-1.5 text-[11px] font-medium text-white">{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between">
            <LangSwitch />
            <button type="button" onClick={toggle} className="grid size-8 place-items-center rounded-md text-ink-2 hover:bg-surface-2" aria-label={t('theme')}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <div className="flex items-center gap-3 border-t border-line pt-3">
            <div className="grid size-8 place-items-center rounded-full bg-surface-2 text-sm font-medium text-ink-2">{user?.username.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.username}</p>
              <p className="truncate text-[12px] text-ink-3">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-danger" aria-label={t('logout')}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 lg:hidden">
          <BrandMark className="size-7" />
          <p className="flex-1 text-[15px] font-semibold">NutriDz <span className="font-normal text-ink-3">Admin</span></p>
          <LangSwitch />
          <button type="button" onClick={toggle} className="grid size-8 place-items-center rounded-md text-ink-2 hover:bg-surface-2" aria-label={t('theme')}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button type="button" onClick={logout} className="grid size-8 place-items-center rounded-md text-ink-2 hover:bg-surface-2" aria-label={t('logout')}>
            <LogOut size={16} />
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 lg:px-10 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4 px-2">
            {[items[0], items[2], items[1], items[3]].map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className="flex flex-col items-center gap-0.5 pb-2 pt-1 text-[11px] font-medium">
                {({ isActive }) => (
                  <>
                    <span className={`relative grid h-7 w-12 place-items-center ${isActive ? 'text-brand' : 'text-ink-3'}`}>
                      <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                      {!!badge && <span className="absolute -top-1 end-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-white">{badge}</span>}
                    </span>
                    <span className={isActive ? 'text-ink' : 'text-ink-3'}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
