import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BadgeCheck, LayoutGrid, List, PackageSearch, RefreshCw, ScanBarcode, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { fmt } from '../lib/format';
import { CATEGORIES, type Food, type FoodCategory } from '../lib/types';
import { Empty, NutriScoreBadge, PageLoader, ProductThumb } from '../components/ui';
import { MacroBar } from '../components/NutritionTable';

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
  const [size, setSize] = useState(24);
  const [view, setView] = useState<'grid' | 'table'>(() => (window.innerWidth >= 1024 ? 'table' : 'grid'));
  const dq = useDebounced(q);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['foods', dq, category, verified, hasBarcode, size],
    queryFn: () => api.foods({ q: dq, category, verified, hasBarcode, size, page: 0 }),
    placeholderData: keepPreviousData,
  });

  const filterChip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} type="button" className={`chip ${on ? 'chip-on' : ''}`} onClick={onClick} aria-pressed={on}>
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-xl font-semibold lg:text-2xl">
          {t('productsTitle')} <span className="text-base font-normal text-ink-3 tabular-nums">{data?.total ?? ''}</span>
        </h1>
        <div className="hidden rounded-xl bg-surface-2 p-1 sm:flex">
          {(['grid', 'table'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={`grid size-9 place-items-center rounded-lg ${view === v ? 'bg-surface text-ink shadow-sm' : 'text-ink-3'}`} aria-pressed={view === v} aria-label={v}>
              {v === 'grid' ? <LayoutGrid size={17} /> : <List size={17} />}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input className="input ps-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} type="search" />
        {isFetching && !isLoading && <RefreshCw size={16} className="absolute end-4 top-1/2 -translate-y-1/2 animate-spin text-ink-3" />}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {filterChip(!category, t('allCategories'), () => setCategory(undefined))}
        {CATEGORIES.map((c) => filterChip(category === c, t(`cat_${c}`), () => setCategory(category === c ? undefined : c)))}
        <span className="mx-1 w-px shrink-0 bg-line" />
        {filterChip(verified === true, t('verified'), () => setVerified(verified === true ? undefined : true))}
        {filterChip(verified === false, t('unverified'), () => setVerified(verified === false ? undefined : false))}
        {filterChip(hasBarcode === true, t('hasCode'), () => setHasBarcode(hasBarcode === true ? undefined : true))}
        {filterChip(hasBarcode === false, t('noCode'), () => setHasBarcode(hasBarcode === false ? undefined : false))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !data?.items.length ? (
        <Empty icon={<PackageSearch size={26} />} text={t('emptyList')} />
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((f) => <FoodCard key={f.id} food={f} />)}
        </ul>
      ) : (
        <FoodTable foods={data.items} />
      )}

      {data && data.total > data.items.length && (
        <button type="button" className="btn-soft w-full" onClick={() => setSize(size + 24)}>
          {t('loadMore')} ({data.items.length}/{data.total})
        </button>
      )}
    </div>
  );
}

function FoodCard({ food: f }: { food: Food }) {
  const { t } = useI18n();
  return (
    <li>
      <Link to={`/products/${f.id}`} className="card flex h-full flex-col gap-3 p-4 transition hover:border-brand">
        <div className="flex gap-3">
          <ProductThumb src={f.imageUrl} alt={f.name} className="size-14" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5">
              <p className="line-clamp-2 font-semibold leading-snug">{f.name}</p>
              {f.verified && <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand" aria-label={t('verified')} />}
            </div>
            <p className="truncate text-[12px] text-ink-3">{[f.brand, t(`cat_${f.category}`)].filter(Boolean).join(' · ')}</p>
          </div>
          <NutriScoreBadge score={f.nutritionalScore} size="sm" />
        </div>
        <div className="mt-auto">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xl font-semibold tabular-nums">{fmt(f.caloriesPer100g, 0)} <span className="text-[12px] font-semibold text-ink-3">kcal/100g</span></span>
            {f.barcode && <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-3"><ScanBarcode size={12} />{f.barcode}</span>}
          </div>
          <MacroBar values={f} />
          <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-3 tabular-nums">
            <span><i className="me-1 inline-block size-2 rounded-full bg-protein" />{fmt(f.proteinPer100g)}g</span>
            <span><i className="me-1 inline-block size-2 rounded-full bg-carbs" />{fmt(f.carbsPer100g)}g</span>
            <span><i className="me-1 inline-block size-2 rounded-full bg-fat" />{fmt(f.fatPer100g)}g</span>
            <span>{t('saltPer100g')} {fmt(f.saltPer100g, 2)}g</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function FoodTable({ foods }: { foods: Food[] }) {
  const { t } = useI18n();
  const cols = ['caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'sugarPer100g', 'fatPer100g', 'fiberPer100g', 'saltPer100g'] as const;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[880px] text-[14px]">
        <thead className="border-b border-line text-[12px] font-semibold text-ink-3">
          <tr>
            <th className="px-4 py-3 text-start">{t('name')}</th>
            <th className="px-2 py-3 text-start">{t('barcode')}</th>
            {cols.map((c) => <th key={c} className="px-2 py-3 text-end">{t(c)}</th>)}
            <th className="px-4 py-3 text-center">NS</th>
          </tr>
        </thead>
        <tbody>
          {foods.map((f) => (
            <tr key={f.id} className="border-b border-line last:border-0 hover:bg-surface-2">
              <td className="px-4 py-2.5">
                <Link to={`/products/${f.id}`} className="flex items-center gap-3">
                  <ProductThumb src={f.imageUrl} alt={f.name} className="size-9 rounded-xl" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="truncate">{f.name}</span>
                      {f.verified && <BadgeCheck size={14} className="shrink-0 text-brand" />}
                    </span>
                    <span className="block truncate text-[12px] text-ink-3">{[f.brand, t(`cat_${f.category}`)].filter(Boolean).join(' · ')}</span>
                  </span>
                </Link>
              </td>
              <td className="px-2 py-2.5 font-mono text-[12px] text-ink-3">{f.barcode ?? '—'}</td>
              {cols.map((c) => (
                <td key={c} className={`px-2 py-2.5 text-end tabular-nums ${c === 'caloriesPer100g' ? 'font-semibold' : ''}`}>
                  {fmt(f[c], c === 'caloriesPer100g' ? 0 : c === 'saltPer100g' ? 2 : 1)}
                </td>
              ))}
              <td className="px-4 py-2.5 text-center"><NutriScoreBadge score={f.nutritionalScore} size="sm" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
