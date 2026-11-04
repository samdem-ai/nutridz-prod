import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ExternalLink, Pencil, RotateCcw, Trash2, X, ZoomIn } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useToast } from '../lib/toast';
import { errorMessage, timeAgo } from '../lib/format';
import { AppPreview } from '../components/AppPreview';
import { NutritionTable } from '../components/NutritionTable';
import { ProductForm, formFromRecord, nutritionOf, toPayload, validateForm, type FormState } from '../components/ProductForm';
import { PageLoader, Spinner, StatusBadge } from '../components/ui';

export function ReviewDetailPage() {
  const { id } = useParams();
  const subId = Number(id);
  const { t, lang } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [zoom, setZoom] = useState(false);

  const { data: s, isLoading } = useQuery({ queryKey: ['submission', subId], queryFn: () => api.submission(subId) });
  const { data: target } = useQuery({
    queryKey: ['food', s?.targetFoodId],
    queryFn: () => api.food(s!.targetFoodId!),
    enabled: !!s?.targetFoodId,
  });

  useEffect(() => {
    if (s) setForm(formFromRecord(s));
  }, [s]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['submissions'] });
    qc.invalidateQueries({ queryKey: ['submission', subId] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    qc.invalidateQueries({ queryKey: ['foods'] });
  };

  /** Next pending item, to keep reviewing without going back to the list. */
  const goNext = async () => {
    const next = await api.submissions({ status: 'PENDING', size: 2 }).catch(() => null);
    const other = next?.items.find((x) => x.id !== subId);
    navigate(other ? `/review/${other.id}` : '/review', { replace: true });
  };

  const onErr = (e: unknown) => toast(errorMessage(e, t), 'error');

  const save = useMutation({
    mutationFn: () => api.updateSubmission(subId, toPayload(form!)),
    onSuccess: () => { refresh(); setEditing(false); toast(t('saved')); },
    onError: onErr,
  });
  const approve = useMutation({
    mutationFn: () => api.approve(subId, editing ? toPayload(form!) : undefined),
    onSuccess: () => { refresh(); toast(t('approvedToast')); goNext(); },
    onError: onErr,
  });
  const reject = useMutation({
    mutationFn: () => api.reject(subId, reason),
    onSuccess: () => { refresh(); setRejecting(false); toast(t('rejectedToast')); goNext(); },
    onError: onErr,
  });
  const reopen = useMutation({ mutationFn: () => api.reopen(subId), onSuccess: refresh, onError: onErr });
  const del = useMutation({
    mutationFn: () => api.deleteSubmission(subId),
    onSuccess: () => { refresh(); navigate('/review', { replace: true }); },
    onError: onErr,
  });

  if (isLoading || !s || !form) return <PageLoader />;

  const pending = s.status === 'PENDING';
  const nutrition = editing ? nutritionOf(form) : s;
  const servings = editing ? toPayload(form).servingSizes : s.servingSizes;
  const busy = approve.isPending || reject.isPending || save.isPending;

  const tryApprove = () => {
    if (editing) {
      const errs = validateForm(form);
      setErrors(errs);
      if (errs.length) return;
    }
    approve.mutate();
  };

  return (
    <div className="">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/review" className="grid size-10 place-items-center rounded-full bg-surface-2 text-ink-2" aria-label={t('back')}>
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold lg:text-2xl" dir="auto">{s.name}</h1>
          <p className="truncate text-[13px] text-ink-3">
            {t('submittedBy')} {s.submittedByName} · {timeAgo(s.createdAt, lang)}
            {s.reviewedByName && <> · {t('reviewedBy')} {s.reviewedByName}</>}
          </p>
        </div>
        <StatusBadge status={s.status} />
      </div>

      {s.status === 'REJECTED' && s.rejectReason && (
        <p className="mb-5 rounded-md bg-danger-50 px-4 py-3 text-sm font-semibold text-danger">{s.rejectReason}</p>
      )}
      {target && (
        <p className="mb-5 rounded-md bg-surface-2 px-4 py-3 text-sm font-semibold text-ink-2">
          {t('updatesExisting')}: <Link to={`/products/${target.id}`} className="text-brand underline">{target.name}</Link>
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Left: the evidence (label photo + OCR) */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold">{t('labelPhoto')}</span>
              {s.labelImage && (
                <button type="button" onClick={() => setZoom(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  <ZoomIn size={16} />
                </button>
              )}
            </div>
            {s.labelImage ? (
              <button type="button" onClick={() => setZoom(true)} className="block w-full bg-black">
                <img src={s.labelImage} alt={t('labelPhoto')} className="max-h-[50vh] w-full object-contain" />
              </button>
            ) : (
              <p className="px-4 pb-5 text-sm text-ink-3">{t('noLabelPhoto')}</p>
            )}
          </div>
          <NutritionTable values={nutrition} serving={servings[0]} compareTo={target ?? null} />
          {s.ocrText && (
            <details className="card p-4">
              <summary className="cursor-pointer text-sm font-semibold">{t('rawText')}</summary>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-[12px] text-ink-2" dir="auto">{s.ocrText}</pre>
            </details>
          )}
        </div>

        {/* Right: app preview or editor */}
        <div>
          {editing ? (
            <div className="card p-5">
              <ProductForm value={form} onChange={(f) => { setForm(f); if (errors.length) setErrors(validateForm(f)); }} errors={errors} />
              <div className="mt-6 flex gap-3">
                <button type="button" className="btn-soft" onClick={() => { setForm(formFromRecord(s)); setEditing(false); setErrors([]); }}>
                  {t('cancel')}
                </button>
                <button type="button" className="btn-dark flex-1" disabled={busy} onClick={() => { const e = validateForm(form); setErrors(e); if (!e.length) save.mutate(); }}>
                  {save.isPending && <Spinner size={18} />} {t('save')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-3 text-center text-[13px] font-semibold text-ink-3">{t('previewTitle')}</p>
              <AppPreview
                {...s}
                image={s.productImage}
              />
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 bg-gradient-to-t from-canvas via-canvas to-transparent px-4 pb-2 pt-6 lg:bottom-0 lg:mx-0 lg:px-0">
        {pending && !rejecting && (
          <div className="flex gap-2">
            <button type="button" className="btn-danger px-4" onClick={() => setRejecting(true)} disabled={busy} aria-label={t('reject')}>
              <X size={18} /> <span className="hidden sm:inline">{t('reject')}</span>
            </button>
            {!editing && (
              <button type="button" className="btn-soft px-4" onClick={() => setEditing(true)} disabled={busy}>
                <Pencil size={17} /> <span className="hidden sm:inline">{t('edit')}</span>
              </button>
            )}
            <button type="button" className="btn-primary flex-1" onClick={tryApprove} disabled={busy}>
              {approve.isPending ? <Spinner size={18} /> : <Check size={18} />} {t('approve')}
            </button>
          </div>
        )}
        {pending && rejecting && (
          <div className="card space-y-3 p-4">
            <label className="label" htmlFor="reason">{t('rejectReason')}</label>
            <textarea id="reason" autoFocus className="input min-h-24 py-3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('rejectPlaceholder')} maxLength={500} />
            <div className="flex gap-2">
              <button type="button" className="btn-soft" onClick={() => setRejecting(false)}>{t('cancel')}</button>
              <button type="button" className="btn flex-1 bg-danger text-white" disabled={!reason.trim() || reject.isPending} onClick={() => reject.mutate()}>
                {reject.isPending && <Spinner size={18} />} {t('confirmReject')}
              </button>
            </div>
          </div>
        )}
        {s.status === 'APPROVED' && s.foodId && (
          <Link to={`/products/${s.foodId}`} className="btn-soft w-full">
            <ExternalLink size={18} /> {t('viewInProducts')}
          </Link>
        )}
        {s.status === 'REJECTED' && (
          <div className="flex gap-2">
            <button type="button" className="btn-danger px-4" onClick={() => confirm(t('confirmDelete')) && del.mutate()} aria-label={t('delete')}>
              <Trash2 size={18} />
            </button>
            <button type="button" className="btn-soft flex-1" onClick={() => reopen.mutate()} disabled={reopen.isPending}>
              <RotateCcw size={18} /> {t('reopen')}
            </button>
          </div>
        )}
      </div>

      {zoom && s.labelImage && (
        <div className="fixed inset-0 z-[70] overflow-auto bg-black/95 p-4" onClick={() => setZoom(false)} role="dialog">
          <button type="button" className="fixed end-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-white" aria-label={t('cancel')}>
            <X size={20} />
          </button>
          <img src={s.labelImage} alt={t('labelPhoto')} className="mx-auto min-w-full max-w-none sm:min-w-0 sm:max-w-full" />
        </div>
      )}
    </div>
  );
}
