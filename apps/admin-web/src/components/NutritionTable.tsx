import type { NutritionFields, ServingSize } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { fmt } from '../lib/format';

const ROWS: { key: keyof NutritionFields; unit: string; indent?: boolean; color?: string }[] = [
  { key: 'caloriesPer100g', unit: 'kcal' },
  { key: 'fatPer100g', unit: 'g', color: 'var(--fat)' },
  { key: 'carbsPer100g', unit: 'g', color: 'var(--carbs)' },
  { key: 'sugarPer100g', unit: 'g', indent: true },
  { key: 'fiberPer100g', unit: 'g', color: 'var(--fiber)' },
  { key: 'proteinPer100g', unit: 'g', color: 'var(--protein)' },
  { key: 'saltPer100g', unit: 'g' },
];

/** Classic nutrition-facts table, with an optional per-serving column. */
export function NutritionTable({ values, serving, compareTo }: { values: NutritionFields; serving?: ServingSize | null; compareTo?: NutritionFields | null }) {
  const { t } = useI18n();
  return (
    <div className="overflow-hidden rounded-md border border-line">
      <table className="w-full text-[14px]">
        <thead className="bg-surface-2 text-[12px] font-semibold text-ink-2">
          <tr>
            <th className="px-3 py-2 text-start" />
            <th className="px-3 py-2 text-end">{t('per100g')}</th>
            {serving && <th className="px-3 py-2 text-end">{serving.label}</th>}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ key, unit, indent, color }) => {
            const v = values[key];
            const old = compareTo?.[key];
            const changed = compareTo && old !== v && !(old == null && v == null);
            return (
              <tr key={key} className="border-t border-line">
                <td className={`px-3 py-2.5 ${indent ? 'ps-7 text-ink-2' : 'font-medium'}`}>
                  <span className="inline-flex items-center gap-2">
                    {color && <span className="size-2 rounded-full" style={{ background: color }} />}
                    {t(key)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-end tabular-nums">
                  {changed && <span className="me-2 text-ink-3 line-through">{fmt(old)}</span>}
                  <span className={changed ? 'rounded-md bg-warn-50 px-1.5 font-semibold' : 'font-semibold'}>{fmt(v, key === 'saltPer100g' ? 2 : 1)}</span>{' '}
                  <span className="text-ink-3">{unit}</span>
                </td>
                {serving && (
                  <td className="px-3 py-2.5 text-end tabular-nums text-ink-2">
                    {v == null ? '—' : fmt((v * serving.grams) / 100, key === 'caloriesPer100g' ? 0 : key === 'saltPer100g' ? 2 : 1)} <span className="text-ink-3">{unit}</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Horizontal macro split bar (protein / carbs / fat by energy). */
export function MacroBar({ values }: { values: NutritionFields }) {
  const p = (values.proteinPer100g ?? 0) * 4;
  const c = (values.carbsPer100g ?? 0) * 4;
  const f = (values.fatPer100g ?? 0) * 9;
  const total = p + c + f;
  if (total <= 0) return <div className="h-2 rounded-full bg-surface-2" />;
  return (
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
      <div style={{ width: `${(p / total) * 100}%`, background: 'var(--protein)' }} />
      <div style={{ width: `${(c / total) * 100}%`, background: 'var(--carbs)' }} />
      <div style={{ width: `${(f / total) * 100}%`, background: 'var(--fat)' }} />
    </div>
  );
}
