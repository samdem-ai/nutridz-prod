import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Keyboard, PackageCheck, QrCode,
  RefreshCw, RotateCw, ScanText, Send, Upload,
} from 'lucide-react';
import { BarcodeScanner, type ScanResult } from '../components/BarcodeScanner';
import { ProductForm, emptyForm, formFromRecord, nutritionOf, toPayload, validateForm, type FieldHint, type FormState, type NumKey } from '../components/ProductForm';
import { AppPreview } from '../components/AppPreview';
import { NutritionTable } from '../components/NutritionTable';
import { Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { useToast } from '../lib/toast';
import { errorMessage } from '../lib/format';
import { compressToDataUri, rotateDataUri } from '../lib/image';
import { preloadOcr, recognizeLabel, type OcrLang } from '../lib/ocr';
import { parseNutritionText, type NutrientKey, type ParsedNutrition } from '../lib/nutritionParser';
import type { BarcodeCheck, Submission } from '../lib/types';

const PARSER_TO_FORM: Record<NutrientKey, NumKey> = {
  calories: 'caloriesPer100g',
  protein: 'proteinPer100g',
  carbs: 'carbsPer100g',
  sugar: 'sugarPer100g',
  fat: 'fatPer100g',
  fiber: 'fiberPer100g',
  salt: 'saltPer100g',
};

type Step = 0 | 1 | 2 | 3;

export function ScanPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [check, setCheck] = useState<BarcodeCheck | null>(null);
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [hints, setHints] = useState<Partial<Record<NumKey, FieldHint>>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<Submission | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const go = (s: Step) => {
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const reset = () => {
    setForm(emptyForm());
    setCheck(null);
    setLabelImage(null);
    setOcrText(null);
    setHints({});
    setErrors([]);
    setDone(null);
    go(0);
  };

  if (done) return <SuccessScreen submission={done} onNext={reset} />;

  const steps = [t('step1'), t('step2'), t('step3'), t('step4')];

  return (
    <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-20">
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`} />
            <span className={`text-[12px] font-semibold ${i === step ? 'text-ink' : 'text-ink-3'}`}>
              {i < step ? <Check size={12} className="me-1 inline" /> : `${i + 1}. `}
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <CodeStep
          form={form}
          check={check}
          onDetected={(code, format, result) => {
            setCheck(result);
            if (result?.existingFood) {
              const f = formFromRecord(result.existingFood);
              setForm({ ...f, barcode: code, codeFormat: format });
            } else {
              setForm((f) => ({ ...f, barcode: code, codeFormat: format }));
            }
          }}
          onClear={() => {
            setCheck(null);
            setForm(emptyForm());
          }}
          onNext={() => go(1)}
        />
      )}

      {step === 1 && (
        <LabelStep
          image={labelImage}
          setImage={setLabelImage}
          onParsed={(text, parsed) => {
            setOcrText(text);
            const nutrients = { ...form.nutrients };
            const h: Partial<Record<NumKey, FieldHint>> = {};
            (Object.keys(PARSER_TO_FORM) as NutrientKey[]).forEach((k) => {
              const fk = PARSER_TO_FORM[k];
              const v = parsed.values[k];
              if (v !== undefined) {
                nutrients[fk] = String(v);
                h[fk] = parsed.derived.includes(k) ? 'derived' : parsed.uncertain.includes(k) ? 'check' : 'ocr';
              } else if (!nutrients[fk]) {
                h[fk] = 'missing';
              }
            });
            setHints(h);
            setForm({ ...form, nutrients, isDrink: form.isDrink || parsed.basis === '100ml' });
          }}
          ocrText={ocrText}
          onBack={() => go(0)}
          onNext={() => go(2)}
        />
      )}

      {step === 2 && (
        <section className="">
          <h1 className="mb-1 text-xl font-semibold">{t('step3')}</h1>
          {check?.existingFood && <p className="mb-4 text-sm font-semibold text-brand">{t('alreadyInAppHint')}</p>}
          <div className="card mt-4 p-5">
            <ProductForm value={form} onChange={(f) => { setForm(f); if (errors.length) setErrors(validateForm(f)); }} hints={hints} errors={errors} />
          </div>
          <StickyActions>
            <button type="button" className="btn-soft" onClick={() => go(1)}>
              <ArrowLeft size={18} className="rtl:rotate-180" /> {t('back')}
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => {
                const errs = validateForm(form);
                setErrors(errs);
                if (errs.length === 0) go(3);
                else document.getElementById(errs[0] === 'name' ? 'name' : 'name')?.focus();
              }}
            >
              {t('continue')} <ArrowRight size={18} className="rtl:rotate-180" />
            </button>
          </StickyActions>
        </section>
      )}

      {step === 3 && (
        <PreviewStep
          form={form}
          check={check}
          labelImage={labelImage}
          ocrText={ocrText}
          onBack={() => go(2)}
          onDone={setDone}
        />
      )}
    </div>
  );
}

function StickyActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 flex gap-3 bg-gradient-to-t from-canvas via-canvas to-transparent px-4 pb-2 pt-6 lg:bottom-0 lg:mx-0 lg:px-0">
      {children}
    </div>
  );
}

// ─── Step 1: barcode / QR ──────────────────────────────────────────

function CodeStep({
  form, check, onDetected, onClear, onNext,
}: {
  form: FormState;
  check: BarcodeCheck | null;
  onDetected: (code: string, format: string, check: BarcodeCheck | null) => void;
  onClear: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [manual, setManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [checking, setChecking] = useState(false);
  const hasCode = !!form.barcode;

  useEffect(() => preloadOcr(['fra', 'eng']), []);

  const handle = async ({ code, format }: ScanResult) => {
    setChecking(true);
    try {
      const res = await api.checkBarcode(code);
      onDetected(code, format, res);
    } catch (e) {
      toast(errorMessage(e, t), 'error');
      onDetected(code, format, null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="">
      <h1 className="text-xl font-semibold">{t('scanCodeTitle')}</h1>
      <p className="mb-5 mt-1 text-ink-2">{t('scanCodeHint')}</p>

      {!hasCode && !checking && (
        <>
          {!manual && <BarcodeScanner onResult={handle} />}
          {manual && (
            <form
              className="card flex flex-col gap-3 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode.trim()) handle({ code: manualCode.trim(), format: 'MANUAL' });
              }}
            >
              <label className="label" htmlFor="manual">{t('manualCode')}</label>
              <input id="manual" autoFocus className="input font-mono text-lg tracking-widest" inputMode="numeric" value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="6130000000000" />
              <button className="btn-primary" type="submit" disabled={!manualCode.trim()}>{t('useCode')}</button>
            </form>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" className="btn-soft" onClick={() => setManual(!manual)}>
              {manual ? <QrCode size={18} /> : <Keyboard size={18} />} {manual ? t('scanAgain') : t('enterManually')}
            </button>
            <button type="button" className="btn-ghost border border-line" onClick={onNext}>
              {t('noBarcode')}
            </button>
          </div>
        </>
      )}

      {checking && (
        <div className="card flex items-center justify-center gap-3 p-10 font-semibold text-ink-2">
          <Spinner /> {t('checking')}
        </div>
      )}

      {hasCode && !checking && (
        <div className="space-y-4">
          <div className="card flex items-center gap-4 p-5">
            <Check size={22} className="shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink-3">{t('codeDetected')} · {form.codeFormat.replace('_', '-')}</p>
              <p className="truncate font-mono text-xl font-semibold tracking-wider">{form.barcode}</p>
            </div>
            <button type="button" className="btn-ghost min-h-10 px-3" onClick={onClear} aria-label={t('scanAgain')}>
              <RefreshCw size={18} />
            </button>
          </div>

          {check?.pendingSubmissionId ? (
            <div className="rounded-lg border border-accent/40 bg-warn-50 p-5">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} className="text-accent" /> {t('alreadyPending')}</p>
              <Link to={`/review/${check.pendingSubmissionId}`} className="btn-dark mt-4 w-full">{t('openPending')}</Link>
            </div>
          ) : check?.existingFood ? (
            <div className="rounded-lg border border-brand/30 bg-brand-50 p-5">
              <p className="flex items-center gap-2 font-semibold text-brand"><PackageCheck size={18} /> {t('alreadyInApp')}</p>
              <p className="mt-1 font-semibold">{check.existingFood.name}</p>
              <p className="mt-1 text-sm text-ink-2">{t('alreadyInAppHint')}</p>
            </div>
          ) : (
            <p className="rounded-md bg-surface-2 px-4 py-3 text-sm font-semibold text-ink-2">{t('newProduct')}</p>
          )}

          {!check?.pendingSubmissionId && (
            <button type="button" className="btn-primary w-full" onClick={onNext}>
              {t('continue')} <ArrowRight size={18} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Step 2: label photo + OCR ─────────────────────────────────────

function LabelStep({
  image, setImage, onParsed, ocrText, onBack, onNext,
}: {
  image: string | null;
  setImage: (s: string | null) => void;
  onParsed: (text: string, parsed: ParsedNutrition) => void;
  ocrText: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [langs, setLangs] = useState<OcrLang[]>(['fra', 'eng']);
  const [progress, setProgress] = useState<{ p: number; status: string } | null>(null);
  const [result, setResult] = useState<ParsedNutrition | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setResult(null);
    setImage(await compressToDataUri(file, 1600, 0.82));
  };

  const read = async () => {
    if (!image) return;
    setResult(null);
    setProgress({ p: 0, status: 'loading' });
    try {
      const { texts } = await recognizeLabel(image, langs, (p, status) => setProgress({ p, status }));
      const parsed = parseNutritionText(texts);
      setResult(parsed);
      onParsed(texts[0], parsed);
    } catch {
      toast(t('genericError'), 'error');
    } finally {
      setProgress(null);
    }
  };

  const found = result ? Object.keys(result.values).length : 0;
  const toggleLang = (l: OcrLang) => setLangs((cur) => (cur.includes(l) ? (cur.length > 1 ? cur.filter((x) => x !== l) : cur) : [...cur, l]));

  return (
    <section className="">
      <h1 className="text-xl font-semibold">{t('labelTitle')}</h1>
      <p className="mb-5 mt-1 text-ink-2">{t('labelHint')}</p>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {!image ? (
        <div className="card flex flex-col items-center gap-4 border-dashed p-8 text-center">
          <ScanText size={28} className="text-ink-3" />
          <div className="grid w-full max-w-xs gap-3">
            <button type="button" className="btn-primary" onClick={() => cameraRef.current?.click()}>
              <Camera size={18} /> {t('takePhoto')}
            </button>
            <button type="button" className="btn-soft" onClick={() => fileRef.current?.click()}>
              <Upload size={18} /> {t('choosePhoto')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg bg-black">
            <img src={image} alt={t('labelPhoto')} className="max-h-[55vh] w-full object-contain" />
            {progress && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white backdrop-blur-sm">
                <Spinner size={28} />
                <p className="font-semibold">{progress.status === 'recognizing text' ? t('reading') : t('ocrLoading')}</p>
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full bg-brand-300 transition-all" style={{ width: `${Math.round(progress.p * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-soft flex-1 min-h-11 text-sm" onClick={() => cameraRef.current?.click()} disabled={!!progress}>
              <Camera size={16} /> {t('retake')}
            </button>
            <button type="button" className="btn-soft flex-1 min-h-11 text-sm" onClick={async () => { setImage(await rotateDataUri(image)); setResult(null); }} disabled={!!progress}>
              <RotateCw size={16} /> {t('rotate')}
            </button>
          </div>

          <div>
            <span className="label">{t('ocrLanguages')}</span>
            <div className="flex gap-2">
              {([['fra', 'Français'], ['ara', 'العربية'], ['eng', 'English']] as [OcrLang, string][]).map(([l, name]) => (
                <button key={l} type="button" className={`chip ${langs.includes(l) ? 'chip-on' : ''}`} onClick={() => toggleLang(l)} aria-pressed={langs.includes(l)}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="btn-dark w-full" onClick={read} disabled={!!progress}>
            <ScanText size={18} /> {t('readLabel')}
          </button>

          {result && (
            <div className={`rounded-lg p-5 ${found ? 'bg-brand-50' : 'bg-warn-50'}`}>
              <p className="font-semibold">{found ? t('ocrFound', { n: found }) : t('ocrNone')}</p>
              {found > 0 && (
                <div className="mt-4">
                  <NutritionTable
                    values={{
                      caloriesPer100g: result.values.calories ?? null,
                      proteinPer100g: result.values.protein ?? null,
                      carbsPer100g: result.values.carbs ?? null,
                      sugarPer100g: result.values.sugar ?? null,
                      fatPer100g: result.values.fat ?? null,
                      fiberPer100g: result.values.fiber ?? null,
                      saltPer100g: result.values.salt ?? null,
                    }}
                  />
                </div>
              )}
              {result.warnings.map((w) => (
                <p key={w} className="mt-3 flex items-start gap-2 text-sm font-semibold text-[#a76400] dark:text-accent">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {w}
                </p>
              ))}
              {ocrText && (
                <div className="mt-3">
                  <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2" onClick={() => setShowRaw(!showRaw)}>
                    <ChevronDown size={16} className={showRaw ? 'rotate-180' : ''} /> {t('rawText')}
                  </button>
                  {showRaw && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-surface p-3 text-[12px] text-ink-2" dir="auto">{ocrText}</pre>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <StickyActions>
        <button type="button" className="btn-soft" onClick={onBack}>
          <ArrowLeft size={18} className="rtl:rotate-180" /> {t('back')}
        </button>
        <button type="button" className={`${result || !image ? 'btn-primary' : 'btn-soft'} flex-1`} onClick={onNext} disabled={!!progress}>
          {image && !result ? t('skipLabel') : !image ? t('skipLabel') : t('continue')} <ArrowRight size={18} className="rtl:rotate-180" />
        </button>
      </StickyActions>
    </section>
  );
}

// ─── Step 4: preview & submit ──────────────────────────────────────

function PreviewStep({
  form, check, labelImage, ocrText, onBack, onDone,
}: {
  form: FormState;
  check: BarcodeCheck | null;
  labelImage: string | null;
  ocrText: string | null;
  onBack: () => void;
  onDone: (s: Submission) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const nutrition = nutritionOf(form);
  const payload = toPayload(form, {
    labelImage,
    ocrText,
    targetFoodId: check?.existingFood?.id ?? null,
  });

  const submit = useMutation({
    mutationFn: () => api.createSubmission(payload),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      toast(t('submitted'));
      onDone(s);
    },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });

  return (
    <section className="">
      <h1 className="text-xl font-semibold">{t('previewTitle')}</h1>
      <p className="mb-6 mt-1 text-ink-2">{t('previewHint')}</p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <AppPreview
          {...nutrition}
          name={form.name}
          nameAr={form.nameAr}
          brand={form.brand}
          barcode={form.barcode}
          category={form.category}
          nutritionalScore={form.nutritionalScore}
          servingSizes={payload.servingSizes}
          image={form.productImage}
        />
        <div className="space-y-4">
          <NutritionTable values={nutrition} serving={payload.servingSizes[0]} compareTo={check?.existingFood ?? null} />
          {labelImage && (
            <div>
              <span className="label">{t('labelPhoto')}</span>
              <img src={labelImage} alt={t('labelPhoto')} className="max-h-60 w-full rounded-md bg-black object-contain" />
            </div>
          )}
        </div>
      </div>
      <StickyActions>
        <button type="button" className="btn-soft" onClick={onBack} disabled={submit.isPending}>
          <ArrowLeft size={18} className="rtl:rotate-180" /> {t('edit')}
        </button>
        <button type="button" className="btn-primary flex-1" onClick={() => submit.mutate()} disabled={submit.isPending}>
          {submit.isPending ? <Spinner size={18} /> : <Send size={18} className="rtl:-scale-x-100" />} {t('submit')}
        </button>
      </StickyActions>
    </section>
  );
}

function SuccessScreen({ submission, onNext }: { submission: Submission; onNext: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-6">
        <p className="flex items-center gap-2 font-semibold text-brand">
          <Check size={18} /> {t('submitted')}
        </p>
        <p className="mt-1 text-sm text-ink-2">{submission.name}</p>
        <div className="mt-6 grid gap-2">
          <button type="button" className="btn-primary" onClick={onNext}>
            <QrCode size={17} /> {t('scanNext')}
          </button>
          <button type="button" className="btn-soft" onClick={() => navigate(`/review/${submission.id}`)}>
            {t('openPending')}
          </button>
        </div>
      </div>
    </div>
  );
}
