import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, ZoomIn } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useToast } from '../lib/toast';
import { errorMessage, timeAgo } from '../lib/format';
import { AppPreview } from '../components/AppPreview';
import { NutritionTable } from '../components/NutritionTable';
import { ProductForm, formFromRecord, nutritionOf, toPayload, validateForm, type FormState } from '../components/ProductForm';
import { BackLink, Chevron, PageLoader, Spinner, StatusBadge } from '../components/ui';

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
    <div>
      <BackLink to={`/review?status=${s.status}`} label={t('reviewTitle')} />
      <h1 className="px-1 text-[26px] font-bold leading-tight tracking-tight" dir="auto">{s.name}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 px-1 text-[15px] text-ink-3">
        <StatusBadge status={s.status} />
        <span>
          · {s.submittedByName}, {timeAgo(s.createdAt, lang)}
          {s.reviewedByName && <> · {t('reviewedBy')} {s.reviewedByName}</>}
        </span>
      </p>

      {s.status === 'REJECTED' && s.rejectReason && (
        <div className="group-list mt-4">
          <p className="cell text-danger">{s.rejectReason}</p>
        </div>
      )}
      {target && (
        <div className="group-list mt-4">
          <Link to={`/products/${target.id}`} className="cell-tap">
            <span className="flex-1 text-[15px] text-ink-3">{t('updatesExisting')}</span>
            <span className="truncate">{target.name}</span>
            <Chevron />
          </Link>
        </div>
      )}

      <div className="items-start gap-8 lg:grid lg:grid-cols-2">
        {/* Evidence: label photo + values */}
        <div className="lg:sticky lg:top-6">
          <h2 className="section-header">{t('labelPhoto')}</h2>
          {s.labelImage ? (
            <button type="button" onClick={() => setZoom(true)} className="relative block w-full overflow-hidden rounded-[10px] bg-black">
              <img src={s.labelImage} alt={t('labelPhoto')} className="max-h-[45vh] w-full object-contain" />
              <span className="absolute bottom-2 end-2 grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur">
                <ZoomIn size={16} />
              </span>
            </button>
          ) : (
            <div className="group-list">
              <p className="cell text-ink-3">{t('noLabelPhoto')}</p>
            </div>
          )}
          <h2 className="section-header">{t('nutrition')}</h2>
          <NutritionTable values={nutrition} serving={servings[0]} compareTo={target ?? null} />
          {s.ocrText && (
            <details className="group-list mt-4">
              <summary className="cell-tap cursor-pointer text-brand">{t('rawText')}</summary>
              <pre className="whitespace-pre-wrap px-4 pb-4 text-[13px] text-ink-3" dir="auto">{s.ocrText}</pre>
            </details>
          )}
        </div>

        {/* App preview, or the editor */}
        <div>
          {editing ? (
            <div className="pt-2">
              <ProductForm value={form} onChange={(f) => { setForm(f); if (errors.length) setErrors(validateForm(f)); }} errors={errors} />
              <div className="mt-6 flex gap-3">
                <button type="button" className="btn-ghost" onClick={() => { setForm(formFromRecord(s)); setEditing(false); setErrors([]); }}>
                  {t('cancel')}
                </button>
                <button type="button" className="btn-soft flex-1" disabled={busy} onClick={() => { const e = validateForm(form); setErrors(e); if (!e.length) save.mutate(); }}>
                  {save.isPending && <Spinner size={18} />} {t('save')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="section-header">{t('previewTitle')}</h2>
              <AppPreview {...s} image={s.productImage} />
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur-xl lg:bottom-0 lg:mx-0 lg:px-0">
        {pending && !rejecting && (
          <div className="space-y-1">
            <button type="button" className="btn-primary w-full" onClick={tryApprove} disabled={busy}>
              {approve.isPending ? <Spinner size={18} /> : null} {t('approve')}
            </button>
            <div className="flex">
              <button type="button" className="btn-ghost flex-1 text-danger" onClick={() => setRejecting(true)} disabled={busy}>
                {t('reject')}
              </button>
              {!editing && (
                <button type="button" className="btn-ghost flex-1" onClick={() => setEditing(true)} disabled={busy}>
                  {t('edit')}
                </button>
              )}
            </div>
          </div>
        )}
        {pending && rejecting && (
          <div>
            <p className="label">{t('rejectReason')}</p>
            <div className="group-list">
              <textarea id="reason" autoFocus className="min-h-24 w-full resize-none bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-ink-3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('rejectPlaceholder')} maxLength={500} />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => setRejecting(false)}>{t('cancel')}</button>
              <button type="button" className="btn flex-1 bg-danger text-white" disabled={!reason.trim() || reject.isPending} onClick={() => reject.mutate()}>
                {reject.isPending && <Spinner size={18} />} {t('confirmReject')}
              </button>
            </div>
          </div>
        )}
        {s.status === 'APPROVED' && s.foodId && (
          <Link to={`/products/${s.foodId}`} className="btn-soft w-full">
            {t('viewInProducts')}
          </Link>
        )}
        {s.status === 'REJECTED' && (
          <div className="space-y-1">
            <button type="button" className="btn-soft w-full" onClick={() => reopen.mutate()} disabled={reopen.isPending}>
              {t('reopen')}
            </button>
            <button type="button" className="btn-ghost w-full text-danger" onClick={() => confirm(t('confirmDelete')) && del.mutate()}>
              {t('delete')}
            </button>
          </div>
        )}
      </div>

      {zoom && s.labelImage && (
        <div className="fixed inset-0 z-[70] overflow-auto bg-black p-4" onClick={() => setZoom(false)} role="dialog">
          <button type="button" className="fixed end-4 top-4 grid size-9 place-items-center rounded-full bg-white/20 text-white" aria-label={t('cancel')}>
            <X size={18} />
          </button>
          <img src={s.labelImage} alt={t('labelPhoto')} className="mx-auto min-w-full max-w-none sm:min-w-0 sm:max-w-full" />
        </div>
      )}
    </div>
  );
}
