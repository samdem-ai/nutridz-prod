import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Pencil, ScanBarcode, ShieldOff } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useToast } from '../lib/toast';
import { errorMessage, fmt } from '../lib/format';
import { AppPreview } from '../components/AppPreview';
import { NutritionTable } from '../components/NutritionTable';
import { ProductForm, formFromRecord, toPayload, validateForm, type FormState } from '../components/ProductForm';
import { NutriScoreScale, PageLoader, ProductThumb, Spinner } from '../components/ui';

export function ProductDetailPage() {
  const { id } = useParams();
  const foodId = Number(id);
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: f, isLoading } = useQuery({ queryKey: ['food', foodId], queryFn: () => api.food(foodId) });
  useEffect(() => {
    if (f) setForm(formFromRecord(f));
  }, [f]);

  const done = () => {
    qc.invalidateQueries({ queryKey: ['food', foodId] });
    qc.invalidateQueries({ queryKey: ['foods'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };
  const save = useMutation({
    mutationFn: () => api.updateFood(foodId, toPayload(form!)),
    onSuccess: () => { done(); setEditing(false); toast(t('saved')); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const verify = useMutation({
    mutationFn: (v: boolean) => api.setVerified(foodId, v),
    onSuccess: () => { done(); toast(t('saved')); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });

  if (isLoading || !f || !form) return <PageLoader />;

  return (
    <div className="">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/products" className="grid size-10 place-items-center rounded-full bg-surface-2 text-ink-2" aria-label={t('back')}>
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold lg:text-2xl" dir="auto">{f.name}</h1>
        {!editing && (
          <button type="button" className="btn-soft min-h-10 px-4 text-sm" onClick={() => setEditing(true)}>
            <Pencil size={16} /> {t('edit')}
          </button>
        )}
      </div>

      {editing ? (
        <div className="mx-auto max-w-2xl">
          <div className="card p-5">
            <ProductForm value={form} onChange={(x) => { setForm(x); if (errors.length) setErrors(validateForm(x)); }} errors={errors} />
          </div>
          <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 flex gap-3 bg-gradient-to-t from-canvas via-canvas to-transparent px-4 pb-2 pt-6 lg:bottom-0 lg:mx-0 lg:px-0">
            <button type="button" className="btn-soft" onClick={() => { setForm(formFromRecord(f)); setEditing(false); setErrors([]); }}>{t('cancel')}</button>
            <button type="button" className="btn-primary flex-1" disabled={save.isPending} onClick={() => { const e = validateForm(form); setErrors(e); if (!e.length) save.mutate(); }}>
              {save.isPending && <Spinner size={18} />} {t('save')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <div className="card flex gap-4 p-5">
              <ProductThumb src={f.imageUrl} alt={f.name} className="size-24 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                {f.nameAr && <p className="text-lg font-semibold" dir="rtl">{f.nameAr}</p>}
                <p className="text-sm text-ink-2">{[f.brand, t(`cat_${f.category}`)].filter(Boolean).join(' · ')}</p>
                {f.barcode && <p className="inline-flex items-center gap-1.5 font-mono text-sm text-ink-2"><ScanBarcode size={15} /> {f.barcode}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {f.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand"><BadgeCheck size={14} /> {t('verified')}</span>
                  ) : (
                    <span className="rounded-full bg-warn-50 px-2.5 py-1 text-[12px] font-semibold text-[#a76400] dark:text-accent">{t('unverified')}</span>
                  )}
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-semibold text-ink-3">{t('source')}: {f.source}</span>
                </div>
              </div>
            </div>
            <div className="card flex items-center justify-between p-5">
              <span className="font-semibold">{t('nutriScore')}</span>
              <NutriScoreScale score={f.nutritionalScore} />
            </div>
            <NutritionTable values={f} serving={f.servingSizes[0]} />
            {f.servingSizes.length > 0 && (
              <div className="card p-5">
                <p className="mb-3 font-semibold">{t('servingSizes')}</p>
                <ul className="divide-y divide-line text-sm">
                  {f.servingSizes.map((s, i) => (
                    <li key={i} className="flex justify-between py-2.5">
                      <span className="font-semibold">{s.label}</span>
                      <span className="tabular-nums text-ink-2">{fmt(s.grams, 0)} g · <b className="text-ink">{fmt(((f.caloriesPer100g ?? 0) * s.grams) / 100, 0)} kcal</b></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" className={f.verified ? 'btn-ghost w-full border border-line' : 'btn-primary w-full'} disabled={verify.isPending} onClick={() => verify.mutate(!f.verified)}>
              {f.verified ? <ShieldOff size={18} /> : <BadgeCheck size={18} />} {f.verified ? t('markUnverified') : t('markVerified')}
            </button>
          </div>
          <div className="lg:col-span-2 lg:sticky lg:top-6">
            <p className="mb-3 text-center text-[13px] font-semibold text-ink-3">{t('previewTitle')}</p>
            <AppPreview {...f} image={f.imageUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
