import { ScanBarcode } from 'lucide-react';
import type { FoodCategory, NutriScore, NutritionFields, ServingSize } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { fmt } from '../lib/format';
import { NutriScoreBadge } from './ui';

interface Props extends NutritionFields {
  name: string;
  nameAr?: string | null;
  brand?: string | null;
  barcode?: string | null;
  category: FoodCategory;
  nutritionalScore: NutriScore | null;
  servingSizes: ServingSize[];
  image?: string | null;
}

/**
 * Mimics how the product appears in the NutriDz mobile app (dark theme,
 * green accent) so reviewers see exactly what users will see.
 */
export function AppPreview(p: Props) {
  const { t } = useI18n();
  const serving = p.servingSizes[0] ?? { label: '100 g', grams: 100 };
  const k = (v: number | null) => (v == null ? null : (v * serving.grams) / 100);
  const macros = [
    { label: t('proteinPer100g'), v: p.proteinPer100g, color: '#3B82F6' },
    { label: t('carbsPer100g'), v: p.carbsPer100g, color: '#F59E0B' },
    { label: t('fatPer100g'), v: p.fatPer100g, color: '#EF4444' },
  ];
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[2.2rem] border-[6px] border-[#222] bg-[#0C0C0C] p-3 text-white" dir="auto">
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-[#2A2A2A]" />
      <div className="flex gap-3 rounded-md bg-[#1B1B1B] p-3">
        {p.image ? (
          <img src={p.image} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-[#252525] text-xl font-semibold text-[#6B7280]">
            {p.name.slice(0, 1) || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[15px] font-semibold leading-tight">{p.name || '—'}</p>
            <NutriScoreBadge score={p.nutritionalScore} size="sm" />
          </div>
          {p.nameAr && <p className="mt-0.5 truncate text-[13px] text-[#9CA3AF]" dir="rtl">{p.nameAr}</p>}
          <p className="mt-1 truncate text-[12px] text-[#6B7280]">
            {[p.brand, t(`cat_${p.category}`)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md bg-[#1B1B1B] p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] text-[#9CA3AF]">{serving.label}</span>
          {p.barcode && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280]">
              <ScanBarcode size={12} /> {p.barcode}
            </span>
          )}
        </div>
        <p className="mt-1 text-4xl font-semibold text-[#22C55E] tabular-nums">
          {fmt(k(p.caloriesPer100g), 0)} <span className="text-base font-semibold text-[#9CA3AF]">kcal</span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {macros.map((m) => (
            <div key={m.label} className="rounded-xl bg-[#252525] p-2.5 text-center">
              <p className="text-[15px] font-semibold tabular-nums" style={{ color: m.color }}>
                {fmt(k(m.v))}g
              </p>
              <p className="truncate text-[11px] text-[#9CA3AF]">{m.label}</p>
            </div>
          ))}
        </div>
        {p.servingSizes.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            {p.servingSizes.map((s, i) => (
              <span
                key={i}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#22C55E] text-black' : 'bg-[#252525] text-[#9CA3AF]'}`}
              >
                {s.label}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 rounded-xl bg-[#22C55E] py-2.5 text-center text-[14px] font-semibold text-black">+ Journal</div>
      </div>
    </div>
  );
}
