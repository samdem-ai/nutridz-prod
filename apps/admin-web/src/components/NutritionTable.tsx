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

const digits = (key: keyof NutritionFields) => (key === 'caloriesPer100g' ? 0 : key === 'saltPer100g' ? 2 : 1);

/**
 * Nutrition facts as a grouped list: per 100 g on the right, per serving
 * underneath in grey. Changed values (vs. the existing product) are flagged.
 */
export function NutritionTable({ values, serving, compareTo }: { values: NutritionFields; serving?: ServingSize | null; compareTo?: NutritionFields | null }) {
  const { t } = useI18n();
  return (
    <div className="group-list">
      <div className="cell min-h-9 py-1.5 text-[13px] text-ink-3">
        <span className="flex-1" />
        <span>{t('per100g')}</span>
        {serving && <span className="w-20 text-end">{serving.label}</span>}
      </div>
      {ROWS.map(({ key, unit, indent, color }) => {
        const v = values[key];
        const old = compareTo?.[key];
        const changed = compareTo && old !== v && !(old == null && v == null);
        return (
          <div key={key} className={`cell ${indent ? 'ps-8' : ''}`}>
            <span className={`flex flex-1 items-center gap-2 ${indent ? 'text-ink-3' : ''}`}>
              {color && <span className="size-2 rounded-full" style={{ background: color }} />}
              {t(key)}
            </span>
            <span className="text-end tabular-nums">
              {changed && <span className="me-2 text-[15px] text-ink-3 line-through">{fmt(old, digits(key))}</span>}
              <span className={changed ? 'font-semibold text-[#c27803]' : ''}>{fmt(v, digits(key))}</span>
              <span className="text-ink-3"> {unit}</span>
            </span>
            {serving && (
              <span className="w-20 text-end text-[15px] tabular-nums text-ink-3">
                {v == null ? '—' : fmt((v * serving.grams) / 100, digits(key))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal macro split bar (protein / carbs / fat by energy). */
export function MacroBar({ values }: { values: NutritionFields }) {
  const p = (values.proteinPer100g ?? 0) * 4;
  const c = (values.carbsPer100g ?? 0) * 4;
  const f = (values.fatPer100g ?? 0) * 9;
  const total = p + c + f;
  if (total <= 0) return <div className="h-1.5 rounded-full bg-fill" />;
  return (
    <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
      <div style={{ width: `${(p / total) * 100}%`, background: 'var(--protein)' }} />
      <div style={{ width: `${(c / total) * 100}%`, background: 'var(--carbs)' }} />
      <div style={{ width: `${(f / total) * 100}%`, background: 'var(--fat)' }} />
    </div>
  );
}
