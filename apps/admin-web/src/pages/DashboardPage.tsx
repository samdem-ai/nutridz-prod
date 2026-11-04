import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ScanBarcode } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { PageLoader, ProductThumb, SectionTitle, StatusBadge } from '../components/ui';
import { CATEGORIES } from '../lib/types';
import { timeAgo } from '../lib/format';

export function DashboardPage() {
  const { t, lang } = useI18n();
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  const recent = useQuery({ queryKey: ['submissions', 'recent'], queryFn: () => api.submissions({ size: 6, page: 0 }) });

  if (stats.isLoading) return <PageLoader />;
  const s = stats.data;

  const tiles = [
    { label: t('totalProducts'), value: s?.totalFoods },
    { label: t('withBarcode'), value: s?.foodsWithBarcode },
    { label: t('pendingReview'), value: s?.pending, to: '/review' },
    { label: t('scannedToday'), value: s?.submittedToday },
  ];
  const maxCat = Math.max(1, ...Object.values(s?.foodsByCategory ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">{t('hello')}</h1>
          <p className="mt-0.5 text-sm text-ink-2">{t('dashboardSubtitle')}</p>
        </div>
        <Link to="/scan" className="btn-primary hidden sm:inline-flex">
          <ScanBarcode size={17} /> {t('startScanning')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, to }) => {
          const body = (
            <>
              <p className="text-[13px] text-ink-2">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? '—'}</p>
            </>
          );
          return to ? (
            <Link key={label} to={to} className="card p-4 hover:border-ink-3">{body}</Link>
          ) : (
            <div key={label} className="card p-4">{body}</div>
          );
        })}
      </div>

      <Link to="/scan" className="btn-primary w-full sm:hidden">
        <ScanBarcode size={17} /> {t('startScanning')}
      </Link>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <SectionTitle action={<Link to="/review" className="text-sm text-brand hover:underline">{t('reviewQueue')}</Link>}>
            {t('navReview')}
          </SectionTitle>
          <p className="mb-2 text-[13px] text-ink-3">
            {s?.pending ?? 0} {t('pendingReview').toLowerCase()} · {s?.approved ?? 0} {t('approved').toLowerCase()} · {s?.rejected ?? 0} {t('rejected').toLowerCase()}
          </p>
          <ul className="divide-y divide-line">
            {recent.data?.items.map((sub) => (
              <li key={sub.id}>
                <Link to={`/review/${sub.id}`} className="flex items-center gap-3 py-2.5">
                  <ProductThumb src={sub.productImage} alt={sub.name} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{sub.name}</p>
                    <p className="truncate text-[12px] text-ink-3">
                      {sub.submittedByName} · {timeAgo(sub.createdAt, lang)}
                    </p>
                  </div>
                  <StatusBadge status={sub.status} />
                </Link>
              </li>
            ))}
            {recent.data?.items.length === 0 && <li className="py-6 text-center text-sm text-ink-3">{t('emptyList')}</li>}
          </ul>
        </section>

        <div className="space-y-4 lg:col-span-2">
          <section className="card p-5">
            <SectionTitle>{t('byCategory')}</SectionTitle>
            <div className="space-y-3">
              {CATEGORIES.map((c) => {
                const n = s?.foodsByCategory[c] ?? 0;
                return (
                  <div key={c}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="text-ink-2">{t(`cat_${c}`)}</span>
                      <span className="tabular-nums">{n}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2">
                      <div className="h-1.5 rounded-full bg-ink-3" style={{ width: `${(n / maxCat) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {!!s?.contributors.length && (
            <section className="card p-5">
              <SectionTitle>{t('topContributors')}</SectionTitle>
              <ul className="divide-y divide-line text-sm">
                {s.contributors.map((c) => (
                  <li key={c.userId} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate">{c.username}</span>
                    <span className="text-[13px] text-ink-3 tabular-nums">
                      {c.submitted} {t('submittedShort')} · {c.approved} {t('approvedShort')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
