import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, House, Package, ScanBarcode } from 'lucide-react';
import { useI18n, type Lang } from '../lib/i18n';
import { api } from '../lib/api';

export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return <img src="/icon.png" alt="" className={`${className} rounded-[22%]`} />;
}

/** Native segmented control for FR / EN / AR. */
export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="segmented w-full" role="group" aria-label={t('language')}>
      {(['fr', 'en', 'ar'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`segment ${lang === l ? 'segment-on' : ''}`}
          aria-pressed={lang === l}
        >
          {l === 'fr' ? 'Français' : l === 'en' ? 'English' : 'العربية'}
        </button>
      ))}
    </div>
  );
}

export function Layout() {
  const { t } = useI18n();
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: api.stats, refetchInterval: 60_000 });
  const pending = stats?.pending ?? 0;

  const items = [
    { to: '/', label: t('navHome'), icon: House, end: true },
    { to: '/scan', label: t('navScan'), icon: ScanBarcode },
    { to: '/review', label: t('navReview'), icon: ClipboardCheck, badge: pending },
    { to: '/products', label: t('navProducts'), icon: Package },
  ];

  return (
    <div className="min-h-dvh lg:flex">
      {/* iPad-style sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e-[0.5px] border-line bg-canvas px-3 pt-6 lg:flex">
        <div className="mb-4 flex items-center gap-2.5 px-3">
          <BrandMark className="size-8" />
          <span className="text-[22px] font-bold tracking-tight">NutriDz</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[17px] ${isActive ? 'bg-brand text-white' : 'text-ink'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={21} className={isActive ? '' : 'text-brand'} />
                  <span className="flex-1">{label}</span>
                  {!!badge && <span className={`text-[15px] ${isActive ? 'text-white/80' : 'text-ink-3'}`}>{badge}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-[max(env(safe-area-inset-top),16px)] lg:px-8 lg:pb-16 lg:pt-10">
          <Outlet />
        </main>

        {/* iOS tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-line bg-bar pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className="flex flex-col items-center gap-0.5 pb-1.5 pt-1.5 text-[10px] font-medium">
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon size={25} strokeWidth={isActive ? 2.1 : 1.7} className={isActive ? 'text-brand' : 'text-ink-3'} />
                      {!!badge && (
                        <span className="absolute -top-1 -end-2.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-[11px] leading-[18px] text-white">
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className={isActive ? 'text-brand' : 'text-ink-3'}>{label}</span>
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
