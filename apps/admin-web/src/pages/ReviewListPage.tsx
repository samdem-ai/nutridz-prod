import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Inbox, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { fmt, timeAgo } from '../lib/format';
import { Chevron, Empty, NutriScoreBadge, PageLoader, PageTitle, ProductThumb, Spinner } from '../components/ui';
import type { SubmissionStatus } from '../lib/types';

const TABS: SubmissionStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export function SearchField({ value, onChange, placeholder, busy }: { value: string; onChange: (v: string) => void; placeholder: string; busy?: boolean }) {
  return (
    <div className="relative">
      <Search size={17} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
      <input className="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type="search" />
      {busy && <Spinner size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-3" />}
    </div>
  );
}

export function ReviewListPage() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as SubmissionStatus) || 'PENDING';
  const [q, setQ] = useState('');
  const [size, setSize] = useState(25);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['submissions', status, q, size],
    queryFn: () => api.submissions({ status, q, size, page: 0 }),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageTitle>{t('reviewTitle')}</PageTitle>

      <div className="mt-3 space-y-3">
        <SearchField value={q} onChange={setQ} placeholder={t('search')} busy={isFetching && !isLoading} />
        <div className="segmented" role="tablist">
          {TABS.map((s) => (
            <button key={s} role="tab" aria-selected={status === s} onClick={() => setParams({ status: s })} className={`segment ${status === s ? 'segment-on' : ''}`}>
              {t(`status_${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <PageLoader />
        ) : !data?.items.length ? (
          <Empty
            icon={<Inbox size={40} strokeWidth={1.4} />}
            text={status === 'PENDING' && !q ? t('emptyPending') : t('emptyList')}
            action={status === 'PENDING' && !q ? <Link to="/scan" className="link mt-1 text-[17px]">{t('startScanning')}</Link> : undefined}
          />
        ) : (
          <>
            <div className="group-list [--inset:80px]">
              {data.items.map((s) => (
                <Link key={s.id} to={`/review/${s.id}`} className="cell-tap py-2">
                  <ProductThumb src={s.productImage} alt={s.name} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium" dir="auto">{s.name}</p>
                      <NutriScoreBadge score={s.nutritionalScore} size="sm" />
                    </div>
                    <p className="truncate text-[15px] text-ink-3">
                      {[s.brand, `${fmt(s.caloriesPer100g, 0)} kcal`, s.targetFoodId ? t('updatesExisting') : null].filter(Boolean).join(' · ')}
                    </p>
                    <p className="truncate text-[13px] text-ink-3">
                      {s.submittedByName} · {timeAgo(s.createdAt, lang)}
                    </p>
                  </div>
                  <Chevron />
                </Link>
              ))}
            </div>
            {data.total > data.items.length && (
              <button type="button" className="link mx-auto mt-4 block min-h-11 text-[17px]" onClick={() => setSize(size + 25)}>
                {t('loadMore')} ({data.items.length}/{data.total})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
