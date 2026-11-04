import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useToast } from '../lib/toast';
import { errorMessage, fmt } from '../lib/format';
import { AppPreview } from '../components/AppPreview';
import { NutritionTable } from '../components/NutritionTable';
import { ProductForm, formFromRecord, toPayload, validateForm, type FormState } from '../components/ProductForm';
import { BackLink, NutriScoreScale, PageLoader, ProductThumb, Spinner } from '../components/ui';

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
    <div>
      <div className="flex items-center justify-between">
        <BackLink to="/products" label={t('productsTitle')} />
        {editing ? (
          <button type="button" className="link mb-2 min-h-11 text-[17px]" onClick={() => { setForm(formFromRecord(f)); setEditing(false); setErrors([]); }}>
            {t('cancel')}
          </button>
        ) : (
          <button type="button" className="link mb-2 min-h-11 text-[17px]" onClick={() => setEditing(true)}>
            {t('edit')}
          </button>
        )}
      </div>

      {editing ? (
        <div className="mx-auto max-w-2xl">
          <ProductForm value={form} onChange={(x) => { setForm(x); if (errors.length) setErrors(validateForm(x)); }} errors={errors} />
          <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur-xl lg:bottom-0 lg:mx-0 lg:px-0">
            <button type="button" className="btn-primary w-full" disabled={save.isPending} onClick={() => { const e = validateForm(form); setErrors(e); if (!e.length) save.mutate(); }}>
              {save.isPending && <Spinner size={18} />} {t('save')}
            </button>
          </div>
        </div>
      ) : (
        <div className="items-start gap-8 lg:grid lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-4 px-1">
              <ProductThumb src={f.imageUrl} alt={f.name} className="size-20 rounded-xl" />
              <div className="min-w-0 flex-1">
                <h1 className="text-[24px] font-bold leading-tight tracking-tight" dir="auto">{f.name}</h1>
                {f.nameAr && <p className="text-[17px] text-ink-3" dir="rtl">{f.nameAr}</p>}
              </div>
            </div>

            <div className="group-list mt-5">
              {f.brand && (
                <div className="cell"><span className="flex-1">{t('brand')}</span><span className="text-ink-3">{f.brand}</span></div>
              )}
              <div className="cell"><span className="flex-1">{t('category')}</span><span className="text-ink-3">{t(`cat_${f.category}`)}</span></div>
              {f.barcode && (
                <div className="cell"><span className="flex-1">{t('barcode')}</span><span className="font-mono text-[15px] text-ink-3">{f.barcode}</span></div>
              )}
              <div className="cell"><span className="flex-1">{t('nutriScore')}</span><NutriScoreScale score={f.nutritionalScore} /></div>
              <div className="cell"><span className="flex-1">{t('source')}</span><span className="text-ink-3">{f.source}</span></div>
              <label className="cell">
                <span className="flex flex-1 items-center gap-1.5">
                  {t('verified')} {f.verified && <BadgeCheck size={17} className="text-brand" />}
                </span>
                <input type="checkbox" className="switch" checked={!!f.verified} disabled={verify.isPending} onChange={(e) => verify.mutate(e.target.checked)} />
              </label>
            </div>

            <h2 className="section-header">{t('nutrition')}</h2>
            <NutritionTable values={f} serving={f.servingSizes[0]} />

            {f.servingSizes.length > 0 && (
              <>
                <h2 className="section-header">{t('servingSizes')}</h2>
                <div className="group-list">
                  {f.servingSizes.map((s, i) => (
                    <div key={i} className="cell">
                      <span className="flex-1">{s.label}</span>
                      <span className="tabular-nums text-ink-3">
                        {fmt(s.grams, 0)} g · {fmt(((f.caloriesPer100g ?? 0) * s.grams) / 100, 0)} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="lg:sticky lg:top-6 lg:col-span-2">
            <h2 className="section-header">{t('previewTitle')}</h2>
            <AppPreview {...f} image={f.imageUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
