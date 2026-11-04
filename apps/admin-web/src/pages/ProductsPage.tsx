import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BadgeCheck, PackageSearch } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { fmt } from '../lib/format';
import { CATEGORIES, type FoodCategory } from '../lib/types';
import { Chevron, Empty, NutriScoreBadge, PageLoader, PageTitle, ProductThumb } from '../components/ui';
import { SearchField } from './ReviewListPage';

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function ProductsPage() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<FoodCategory | undefined>();
  const [verified, setVerified] = useState<boolean | undefined>();
  const [hasBarcode, setHasBarcode] = useState<boolean | undefined>();
  const [size, setSize] = useState(30);
  const dq = useDebounced(q);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['foods', dq, category, verified, hasBarcode, size],
    queryFn: () => api.foods({ q: dq, category, verified, hasBarcode, size, page: 0 }),
    placeholderData: keepPreviousData,
  });

  const chip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} type="button" className={`chip ${on ? 'chip-on' : ''}`} onClick={onClick} aria-pressed={on}>
      {label}
    </button>
  );

  return (
    <div>
      <PageTitle subtitle={data ? `${data.total} ${t('productsTitle').toLowerCase()}` : undefined}>{t('productsTitle')}</PageTitle>

      <div className="mt-3">
        <SearchField value={q} onChange={setQ} placeholder={t('search')} busy={isFetching && !isLoading} />
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {chip(!category, t('allCategories'), () => setCategory(undefined))}
        {CATEGORIES.map((c) => chip(category === c, t(`cat_${c}`), () => setCategory(category === c ? undefined : c)))}
        {chip(verified === false, t('unverified'), () => setVerified(verified === false ? undefined : false))}
        {chip(hasBarcode === true, t('hasCode'), () => setHasBarcode(hasBarcode === true ? undefined : true))}
        {chip(hasBarcode === false, t('noCode'), () => setHasBarcode(hasBarcode === false ? undefined : false))}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <PageLoader />
        ) : !data?.items.length ? (
          <Empty icon={<PackageSearch size={40} strokeWidth={1.4} />} text={t('emptyList')} />
        ) : (
          <>
            <div className="group-list [--inset:72px]">
              {data.items.map((f) => (
                <Link key={f.id} to={`/products/${f.id}`} className="cell-tap py-2">
                  <ProductThumb src={f.imageUrl} alt={f.name} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate" dir="auto">
                      <span className="truncate">{f.name}</span>
                      {f.verified && <BadgeCheck size={15} className="shrink-0 text-brand" aria-label={t('verified')} />}
                    </p>
                    <p className="truncate text-[13px] text-ink-3">
                      {[f.brand, t(`cat_${f.category}`), f.barcode].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[15px] tabular-nums">{fmt(f.caloriesPer100g, 0)}</p>
                    <p className="text-[11px] text-ink-3">kcal</p>
                  </div>
                  <span className="w-6">
                    <NutriScoreBadge score={f.nutritionalScore} size="sm" />
                  </span>
                  <Chevron />
                </Link>
              ))}
            </div>
            {data.total > data.items.length && (
              <button type="button" className="link mx-auto mt-4 block min-h-11 text-[17px]" onClick={() => setSize(size + 30)}>
                {t('loadMore')} ({data.items.length}/{data.total})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
