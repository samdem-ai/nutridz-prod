import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ScanBarcode } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { useTheme, type ThemePref } from '../lib/theme';
import { Chevron, PageLoader, PageTitle, ProductThumb, SectionTitle, StatusBadge } from '../components/ui';
import { LangSwitch } from '../components/Layout';
import { CATEGORIES } from '../lib/types';
import { timeAgo } from '../lib/format';

export function DashboardPage() {
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const { pref, setPref } = useTheme();
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  const recent = useQuery({ queryKey: ['submissions', 'recent'], queryFn: () => api.submissions({ size: 5, page: 0 }) });

  if (stats.isLoading) return <PageLoader />;
  const s = stats.data;

  const Row = ({ label, value, to, strong }: { label: string; value?: number; to?: string; strong?: boolean }) => {
    const inner = (
      <>
        <span className="flex-1">{label}</span>
        <span className={`tabular-nums ${strong ? 'font-semibold text-ink' : 'text-ink-3'}`}>{value ?? '—'}</span>
        {to && <Chevron />}
      </>
    );
    return to ? (
      <Link to={to} className="cell-tap">{inner}</Link>
    ) : (
      <div className="cell">{inner}</div>
    );
  };

  return (
    <div>
      <PageTitle>{t('hello')}</PageTitle>

      <Link to="/scan" className="btn-primary mt-4 w-full">
        <ScanBarcode size={21} /> {t('startScanning')}
      </Link>

      <SectionTitle>{t('navReview')}</SectionTitle>
      <div className="group-list">
        <Row label={t('pendingReview')} value={s?.pending} to="/review" strong={!!s?.pending} />
        <Row label={t('approved')} value={s?.approved} to="/review?status=APPROVED" />
        <Row label={t('rejected')} value={s?.rejected} to="/review?status=REJECTED" />
      </div>

      <SectionTitle>{t('database')}</SectionTitle>
      <div className="group-list">
        <Row label={t('totalProducts')} value={s?.totalFoods} to="/products" />
        <Row label={t('withBarcode')} value={s?.foodsWithBarcode} />
        <Row label={t('scannedToday')} value={s?.submittedToday} />
      </div>

      {!!recent.data?.items.length && (
        <>
          <SectionTitle action={<Link to="/review?status=APPROVED" className="link">{t('all')}</Link>}>{t('recent')}</SectionTitle>
          <div className="group-list [--inset:72px]">
            {recent.data.items.map((sub) => (
              <Link key={sub.id} to={`/review/${sub.id}`} className="cell-tap">
                <ProductThumb src={sub.productImage} alt={sub.name} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{sub.name}</p>
                  <p className="truncate text-[13px] text-ink-3">
                    {sub.submittedByName} · {timeAgo(sub.createdAt, lang)}
                  </p>
                </div>
                <StatusBadge status={sub.status} />
              </Link>
            ))}
          </div>
        </>
      )}

      <SectionTitle>{t('byCategory')}</SectionTitle>
      <div className="group-list">
        {CATEGORIES.map((c) => (
          <Row key={c} label={t(`cat_${c}`)} value={s?.foodsByCategory[c] ?? 0} />
        ))}
      </div>

      {!!s?.contributors.length && (
        <>
          <SectionTitle>{t('topContributors')}</SectionTitle>
          <div className="group-list">
            {s.contributors.map((c) => (
              <div key={c.userId} className="cell">
                <span className="flex-1 truncate">{c.username}</span>
                <span className="text-[15px] text-ink-3 tabular-nums">
                  {c.submitted} {t('submittedShort')} · {c.approved} {t('approvedShort')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>{t('settings')}</SectionTitle>
      <div className="group-list">
        <div className="cell flex-col items-stretch gap-2">
          <span className="text-[15px] text-ink-3">{t('language')}</span>
          <LangSwitch />
        </div>
        <div className="cell flex-col items-stretch gap-2">
          <span className="text-[15px] text-ink-3">{t('appearance')}</span>
          <div className="segmented">
            {(['auto', 'light', 'dark'] as ThemePref[]).map((p) => (
              <button key={p} type="button" onClick={() => setPref(p)} className={`segment ${pref === p ? 'segment-on' : ''}`} aria-pressed={pref === p}>
                {t(p === 'auto' ? 'themeAuto' : p === 'light' ? 'themeLight' : 'themeDark')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle>{t('account')}</SectionTitle>
      <div className="group-list">
        <div className="cell">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fill text-[15px] font-semibold text-ink-3">
            {user?.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate">{user?.username}</p>
            <p className="truncate text-[13px] text-ink-3">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={logout} className="cell-tap justify-center text-danger">
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
