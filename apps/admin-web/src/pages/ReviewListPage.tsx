import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronRight, Inbox, RefreshCw, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { fmt, timeAgo } from '../lib/format';
import { Empty, NutriScoreBadge, PageLoader, ProductThumb, StatusBadge } from '../components/ui';
import type { SubmissionStatus } from '../lib/types';

const TABS: SubmissionStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export function ReviewListPage() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as SubmissionStatus) || 'PENDING';
  const [q, setQ] = useState('');
  const [size, setSize] = useState(20);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['submissions', status, q, size],
    queryFn: () => api.submissions({ status, q, size, page: 0 }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold lg:text-2xl">{t('reviewTitle')}</h1>
        <p className="mt-1 text-ink-2">{t('reviewSubtitle')}</p>
      </div>

      <div className="flex gap-1 rounded-md border border-line bg-surface-2 p-1" role="tablist">
        {TABS.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={status === s}
            onClick={() => setParams({ status: s })}
            className={`min-h-9 flex-1 rounded text-sm font-medium ${status === s ? 'bg-surface text-ink' : 'text-ink-3'}`}
          >
            {t(`status_${s}`)}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input className="input ps-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} type="search" />
        {isFetching && !isLoading && <RefreshCw size={16} className="absolute end-4 top-1/2 -translate-y-1/2 animate-spin text-ink-3" />}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !data?.items.length ? (
        <Empty
          icon={<Inbox size={22} />}
          text={status === 'PENDING' && !q ? t('emptyPending') : t('emptyList')}
          action={status === 'PENDING' && !q ? <Link to="/scan" className="btn-primary mt-2">{t('startScanning')}</Link> : undefined}
        />
      ) : (
        <>
          <ul className="grid gap-3 lg:grid-cols-2">
            {data.items.map((s) => (
              <li key={s.id}>
                <Link to={`/review/${s.id}`} className="card flex items-center gap-3.5 p-3.5 transition hover:border-brand">
                  <ProductThumb src={s.productImage} alt={s.name} className="size-16" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{s.name}</p>
                      <NutriScoreBadge score={s.nutritionalScore} size="sm" />
                    </div>
                    <p className="truncate text-[13px] text-ink-3">
                      {[s.brand, s.barcode].filter(Boolean).join(' · ') || t(`cat_${s.category}`)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand tabular-nums">{fmt(s.caloriesPer100g, 0)} kcal</span>
                      {s.targetFoodId && <span className="rounded-full bg-surface-2 px-2 py-0.5 font-semibold text-ink-2">{t('updatesExisting')}</span>}
                      {status !== 'PENDING' && <StatusBadge status={s.status} />}
                      <span className="text-ink-3">{s.submittedByName} · {timeAgo(s.createdAt, lang)}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="shrink-0 text-ink-3 rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
          {data.total > data.items.length && (
            <button type="button" className="btn-soft w-full" onClick={() => setSize(size + 20)}>
              {t('loadMore')} ({data.items.length}/{data.total})
            </button>
          )}
        </>
      )}
    </div>
  );
}
