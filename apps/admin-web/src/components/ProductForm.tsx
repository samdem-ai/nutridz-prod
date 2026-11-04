import { useRef } from 'react';
import { Camera, Check, ImagePlus, Minus, Plus, X } from 'lucide-react';
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

  const hintText = (h: FieldHint) => (h === 'ocr' ? 'OCR' : h === 'derived' ? t('derivedFrom') : h === 'check' ? t('toCheck') : t('missing'));
  const hintColor = (h: FieldHint) => (h === 'ocr' || h === 'derived' ? 'text-brand' : 'text-[#c27803]');

  return (
    <div>
      {/* Product photo */}
      <h2 className="section-header pt-2">{t('productPhoto')}</h2>
      <div className="group-list">
        <div className="cell py-3">
          <div className="relative">
            {f.productImage ? (
              <img src={f.productImage} alt="" className="size-16 rounded-lg object-cover" />
            ) : (
              <div className="grid size-16 place-items-center rounded-lg bg-fill text-ink-3">
                <ImagePlus size={24} />
              </div>
            )}
            {f.productImage && (
              <button
                type="button"
                onClick={() => set({ productImage: null })}
                className="absolute -end-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink-3 text-white"
                aria-label={t('delete')}
              >
                <X size={13} strokeWidth={3} />
              </button>
            )}
          </div>
          <div className="flex flex-1 flex-col items-start gap-1">
            <button type="button" className="link inline-flex items-center gap-1.5" onClick={() => cameraRef.current?.click()}>
              <Camera size={18} /> {t('takePhoto')}
            </button>
            <button type="button" className="link" onClick={() => fileRef.current?.click()}>
              {t('choosePhoto')}
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        </div>
      </div>
      <p className="section-footer">{t('productPhotoHint')}</p>

      {/* Identity */}
      <h2 className="section-header">{t('identity')}</h2>
      <div className="group-list">
        <label className="cell">
          <span className={`w-32 shrink-0 ${err('name') ? 'text-danger' : ''}`}>{t('name')}</span>
          <input id="name" className="field" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder={t('required')} autoComplete="off" dir="auto" />
        </label>
        <label className="cell">
          <span className="w-32 shrink-0">{t('nameAr')}</span>
          <input id="nameAr" className="field" dir="rtl" value={f.nameAr} onChange={(e) => set({ nameAr: e.target.value })} placeholder="سيليكتو" autoComplete="off" />
        </label>
        <label className="cell">
          <span className="w-32 shrink-0">{t('brand')}</span>
          <input id="brand" className="field" value={f.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Hamoud Boualem" autoComplete="off" />
        </label>
        {showBarcode && (
          <label className="cell">
            <span className="w-32 shrink-0">{t('barcode')}</span>
            <input id="barcode" className="field font-mono" inputMode="numeric" value={f.barcode} onChange={(e) => set({ barcode: e.target.value })} placeholder="—" autoComplete="off" />
          </label>
        )}
      </div>

      {/* Category */}
      <h2 className="section-header">{t('category')}</h2>
      <div className="group-list">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => set({ category: c })} className="cell-tap" aria-pressed={f.category === c}>
            <span className="flex-1">{t(`cat_${c}`)}</span>
            {f.category === c && <Check size={20} strokeWidth={2.5} className="text-brand" />}
          </button>
        ))}
        <label className="cell">
          <span className="flex-1">{t('isDrink')}</span>
          <input type="checkbox" className="switch" checked={f.isDrink} onChange={(e) => set({ isDrink: e.target.checked })} />
        </label>
      </div>

      {/* Nutrition */}
      <h2 className="section-header">
        {t('nutrition')} · {f.isDrink ? t('per100ml') : t('per100g')}
      </h2>
      <div className="group-list">
        {NUTRIENT_FIELDS.map(({ key, unit }) => {
          const hint = hints[key];
          const bad = err(key);
          return (
            <label key={key} className={`cell ${key === 'sugarPer100g' ? 'ps-8' : ''}`}>
              <span className="min-w-0 flex-1">
                <span className={`block ${bad ? 'text-danger' : key === 'sugarPer100g' ? 'text-ink-3' : ''}`}>{t(key as TKey)}</span>
                {hint && <span className={`block text-[12px] ${hintColor(hint)}`}>{hintText(hint)}</span>}
              </span>
              <input
                className="field w-24 flex-none tabular-nums"
                inputMode="decimal"
                value={f.nutrients[key]}
                onChange={(e) => setNutrient(key, e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder={key === 'caloriesPer100g' ? t('required') : '—'}
                aria-invalid={bad}
              />
              <span className="w-9 shrink-0 text-ink-3">{unit}</span>
            </label>
          );
        })}
      </div>

      {/* Nutri-Score */}
      <h2 className="section-header">{t('nutriScore')}</h2>
      <div className="group-list">
        <div className="cell justify-between py-3">
          {(['A', 'B', 'C', 'D', 'E'] as NutriScore[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ nutritionalScore: f.nutritionalScore === s ? null : s })}
              className={`rounded-xl p-1 ${f.nutritionalScore === s ? 'ring-2 ring-ink' : f.nutritionalScore ? 'opacity-35' : ''}`}
              aria-pressed={f.nutritionalScore === s}
            >
              <NutriScoreBadge score={s} size="lg" />
            </button>
          ))}
        </div>
        {suggestion && suggestion !== f.nutritionalScore && (
          <button type="button" className="cell-tap text-brand" onClick={() => set({ nutritionalScore: suggestion })}>
            <span className="flex-1">{t('suggested')}</span>
            <NutriScoreBadge score={suggestion} size="sm" />
          </button>
        )}
      </div>

      {/* Serving sizes */}
      <h2 className="section-header">{t('servingSizes')}</h2>
      <div className="group-list">
        {f.servingSizes.map((s, i) => (
          <div key={i} className="cell">
            <button type="button" className="grid size-6 shrink-0 place-items-center rounded-full bg-danger text-white" onClick={() => set({ servingSizes: f.servingSizes.filter((_, j) => j !== i) })} aria-label={t('delete')}>
              <Minus size={14} strokeWidth={3} />
            </button>
            <input
              className="field text-start"
              value={s.label}
              placeholder={t('servingLabel')}
              onChange={(e) => set({ servingSizes: f.servingSizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
            />
            <input
              className="field w-16 flex-none tabular-nums"
              inputMode="decimal"
              value={s.grams}
              placeholder="0"
              onChange={(e) => set({ servingSizes: f.servingSizes.map((x, j) => (j === i ? { ...x, grams: e.target.value.replace(/[^\d.,]/g, '') } : x)) })}
            />
            <span className="w-4 shrink-0 text-ink-3">{t('grams')}</span>
          </div>
        ))}
        <button type="button" className="cell-tap text-brand" onClick={() => set({ servingSizes: [...f.servingSizes, { label: '', grams: '' }] })}>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#34c759] text-white">
            <Plus size={14} strokeWidth={3} />
          </span>
          {t('addServing')}
        </button>
      </div>
    </div>
  );
}
