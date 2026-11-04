import { useRef } from 'react';
import { Camera, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useI18n, type TKey } from '../lib/i18n';
import { CATEGORIES, NUTRIENT_FIELDS, type Food, type FoodCategory, type NutriScore, type NutritionFields, type ProductPayload, type Submission } from '../lib/types';
import { compressToDataUri } from '../lib/image';
import { suggestNutriScore } from '../lib/nutritionParser';
import { NutriScoreBadge } from './ui';

export type NumKey = keyof NutritionFields;

export interface FormState {
  barcode: string;
  codeFormat: string;
  name: string;
  nameAr: string;
  brand: string;
  category: FoodCategory;
  nutrients: Record<NumKey, string>;
  nutritionalScore: NutriScore | null;
  servingSizes: { label: string; grams: string }[];
  productImage: string | null;
  isDrink: boolean;
}

export type FieldHint = 'ocr' | 'derived' | 'check' | 'missing';

const emptyNutrients = (): Record<NumKey, string> =>
  Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f.key, ''])) as Record<NumKey, string>;

export function emptyForm(): FormState {
  return {
    barcode: '',
    codeFormat: '',
    name: '',
    nameAr: '',
    brand: '',
    category: 'PACKAGED_PRODUCT',
    nutrients: emptyNutrients(),
    nutritionalScore: null,
    servingSizes: [],
    productImage: null,
    isDrink: false,
  };
}

const numStr = (v: number | null | undefined) => (v == null ? '' : String(v));

export function formFromRecord(r: Submission | Food): FormState {
  const nutrients = emptyNutrients();
  NUTRIENT_FIELDS.forEach(({ key }) => (nutrients[key] = numStr(r[key])));
  return {
    barcode: r.barcode ?? '',
    codeFormat: 'codeFormat' in r ? (r.codeFormat ?? '') : '',
    name: r.name,
    nameAr: r.nameAr ?? '',
    brand: r.brand ?? '',
    category: r.category,
    nutrients,
    nutritionalScore: r.nutritionalScore,
    servingSizes: r.servingSizes.map((s) => ({ label: s.label, grams: String(s.grams) })),
    productImage: 'productImage' in r ? r.productImage : r.imageUrl,
    isDrink: false,
  };
}

const toNum = (s: string): number | null => {
  const v = parseFloat(s.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};

export function nutritionOf(f: FormState): NutritionFields {
  return Object.fromEntries(NUTRIENT_FIELDS.map(({ key }) => [key, toNum(f.nutrients[key])])) as unknown as NutritionFields;
}

/** Converts the form into the API payload. `includeImage` false keeps the stored image. */
export function toPayload(f: FormState, extra: Partial<ProductPayload> = {}, includeImage = true): ProductPayload {
  return {
    barcode: f.barcode.trim() || null,
    codeFormat: f.codeFormat || null,
    name: f.name.trim(),
    nameAr: f.nameAr.trim() || null,
    brand: f.brand.trim() || null,
    category: f.category,
    ...nutritionOf(f),
    nutritionalScore: f.nutritionalScore,
    servingSizes: f.servingSizes
      .map((s) => ({ label: s.label.trim(), grams: toNum(s.grams) ?? 0 }))
      .filter((s) => s.label && s.grams > 0),
    productImage: includeImage && f.productImage?.startsWith('data:') ? f.productImage : null,
    ...extra,
  };
}

/** Returns translation keys of problems that block submission. */
export function validateForm(f: FormState): string[] {
  const errors: string[] = [];
  if (!f.name.trim()) errors.push('name');
  const kcal = toNum(f.nutrients.caloriesPer100g);
  if (kcal == null) errors.push('caloriesPer100g');
  NUTRIENT_FIELDS.forEach(({ key, max }) => {
    const v = f.nutrients[key];
    if (v && (toNum(v) == null || toNum(v)! < 0 || toNum(v)! > max)) errors.push(key);
  });
  return errors;
}

interface Props {
  value: FormState;
  onChange: (f: FormState) => void;
  hints?: Partial<Record<NumKey, FieldHint>>;
  errors?: string[];
  showBarcode?: boolean;
}

export function ProductForm({ value: f, onChange, hints = {}, errors = [], showBarcode = true }: Props) {
  const { t } = useI18n();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<FormState>) => onChange({ ...f, ...patch });
  const setNutrient = (key: NumKey, v: string) => onChange({ ...f, nutrients: { ...f.nutrients, [key]: v } });

  const nutrition = nutritionOf(f);
  const suggestion = suggestNutriScore(
    {
      calories: nutrition.caloriesPer100g ?? undefined,
      sugar: nutrition.sugarPer100g ?? undefined,
      fat: nutrition.fatPer100g ?? undefined,
      salt: nutrition.saltPer100g ?? undefined,
      fiber: nutrition.fiberPer100g ?? undefined,
      protein: nutrition.proteinPer100g ?? undefined,
    },
    f.isDrink,
  );

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    set({ productImage: await compressToDataUri(file, 640, 0.75) });
  };

  const err = (k: string) => errors.includes(k);

  return (
    <div className="space-y-6">
      {/* Product photo */}
      <section>
        <span className="label">{t('productPhoto')}</span>
        <div className="flex items-center gap-4">
          <div className="relative">
            {f.productImage ? (
              <img src={f.productImage} alt="" className="size-24 rounded-lg object-cover ring-1 ring-line" />
            ) : (
              <div className="grid size-24 place-items-center rounded-lg border-2 border-dashed border-line bg-surface-2 text-ink-3">
                <ImagePlus size={28} />
              </div>
            )}
            {f.productImage && (
              <button
                type="button"
                onClick={() => set({ productImage: null })}
                className="absolute -end-2 -top-2 grid size-7 place-items-center rounded-full bg-ink text-canvas shadow"
                aria-label={t('delete')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-[13px] text-ink-3">{t('productPhotoHint')}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-soft min-h-10 px-4 text-sm" onClick={() => cameraRef.current?.click()}>
                <Camera size={16} /> {t('takePhoto')}
              </button>
              <button type="button" className="btn-ghost min-h-10 px-4 text-sm" onClick={() => fileRef.current?.click()}>
                {t('choosePhoto')}
              </button>
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        </div>
      </section>

      {/* Identity */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            {t('name')} <span className="text-danger">*</span>
          </label>
          <input id="name" className={`input ${err('name') ? '!border-danger' : ''}`} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Selecto 1L" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="nameAr">{t('nameAr')}</label>
          <input id="nameAr" className="input" dir="rtl" value={f.nameAr} onChange={(e) => set({ nameAr: e.target.value })} placeholder="سيليكتو" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="brand">{t('brand')}</label>
          <input id="brand" className="input" value={f.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Hamoud Boualem" autoComplete="off" />
        </div>
        {showBarcode && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="barcode">{t('barcode')}</label>
            <input id="barcode" className="input font-mono tracking-wider" inputMode="numeric" value={f.barcode} onChange={(e) => set({ barcode: e.target.value })} autoComplete="off" />
          </div>
        )}
      </section>

      {/* Category */}
      <section>
        <span className="label">{t('category')}</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => set({ category: c })} className={`chip ${f.category === c ? 'chip-on' : ''}`} aria-pressed={f.category === c}>
              {t(`cat_${c}`)}
            </button>
          ))}
          <button type="button" onClick={() => set({ isDrink: !f.isDrink })} className={`chip ${f.isDrink ? 'chip-on' : ''}`} aria-pressed={f.isDrink}>
            {t('isDrink')}
          </button>
        </div>
      </section>

      {/* Nutrition */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="label mb-0">{t('nutrition')}</span>
          <span className="text-[12px] font-semibold text-ink-3">{f.isDrink ? t('per100ml') : t('per100g')}</span>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
          {NUTRIENT_FIELDS.map(({ key, unit }) => {
            const hint = hints[key];
            const bad = err(key);
            return (
              <label
                key={key}
                className={`flex min-h-14 items-center gap-2 px-4 py-1.5 sm:gap-3 ${bad ? 'bg-danger-50' : hint === 'missing' || hint === 'check' ? 'bg-warn-50' : hint ? 'bg-brand-50/60' : ''}`}
              >
                <span className={`flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[15px] ${key === 'sugarPer100g' ? 'ps-3 text-ink-2' : 'font-medium'}`}>
                  <span>
                    {t(key as TKey)}
                    {key === 'caloriesPer100g' && <span className="text-danger"> *</span>}
                  </span>
                  {hint && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        hint === 'missing' || hint === 'check' ? 'bg-accent/20 text-[#a76400] dark:text-accent' : 'bg-brand-100 text-brand'
                      }`}
                    >
                      {hint === 'ocr' ? 'OCR' : hint === 'derived' ? t('derivedFrom') : hint === 'check' ? t('toCheck') : t('missing')}
                    </span>
                  )}
                </span>
                <input
                  className="w-20 shrink-0 rounded-md border sm:w-24 border-line bg-surface px-2.5 py-1.5 text-end text-[16px] tabular-nums outline-none focus:border-brand"
                  inputMode="decimal"
                  value={f.nutrients[key]}
                  onChange={(e) => setNutrient(key, e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="—"
                  aria-invalid={bad}
                />
                <span className="w-8 shrink-0 text-[13px] text-ink-3">{unit}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Nutri-Score */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="label mb-0">{t('nutriScore')}</span>
          {suggestion && suggestion !== f.nutritionalScore && (
            <button type="button" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand" onClick={() => set({ nutritionalScore: suggestion })}>
              {t('suggested')} : <NutriScoreBadge score={suggestion} size="sm" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(['A', 'B', 'C', 'D', 'E'] as NutriScore[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ nutritionalScore: f.nutritionalScore === s ? null : s })}
              className={`grid flex-1 place-items-center rounded-md border py-2 transition ${f.nutritionalScore === s ? 'border-ink bg-surface-2' : 'border-line opacity-60'}`}
              aria-pressed={f.nutritionalScore === s}
            >
              <NutriScoreBadge score={s} />
            </button>
          ))}
        </div>
      </section>

      {/* Serving sizes */}
      <section>
        <span className="label">{t('servingSizes')}</span>
        <div className="space-y-2">
          {f.servingSizes.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input flex-1"
                value={s.label}
                placeholder={t('servingLabel')}
                onChange={(e) => set({ servingSizes: f.servingSizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
              />
              <div className="relative w-28">
                <input
                  className="input pe-8 text-end tabular-nums"
                  inputMode="decimal"
                  value={s.grams}
                  onChange={(e) => set({ servingSizes: f.servingSizes.map((x, j) => (j === i ? { ...x, grams: e.target.value.replace(/[^\d.,]/g, '') } : x)) })}
                />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">{t('grams')}</span>
              </div>
              <button type="button" className="grid size-12 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-danger-50 hover:text-danger" onClick={() => set({ servingSizes: f.servingSizes.filter((_, j) => j !== i) })} aria-label={t('delete')}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="btn-ghost min-h-11 w-full border border-dashed border-line text-sm" onClick={() => set({ servingSizes: [...f.servingSizes, { label: '', grams: '' }] })}>
            <Plus size={16} /> {t('addServing')}
          </button>
        </div>
      </section>
    </div>
  );
}
