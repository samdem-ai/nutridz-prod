import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import type { NutriScore, SubmissionStatus } from '../lib/types';
import { useI18n } from '../lib/i18n';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function PageLoader() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-ink-3">
      <Spinner /> {t('loading')}
    </div>
  );
}

export function Empty({ icon, text, action }: { icon: ReactNode; text: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="text-ink-3">{icon}</div>
      <p className="text-sm text-ink-2">{text}</p>
      {action}
    </div>
  );
}

const SCORE_COLORS: Record<NutriScore, string> = {
  A: '#038141',
  B: '#85BB2F',
  C: '#FECB02',
  D: '#EE8100',
  E: '#E63E11',
};

export function NutriScoreBadge({ score, size = 'md' }: { score: NutriScore | null; size?: 'sm' | 'md' | 'lg' }) {
  if (!score) return null;
  const dims = size === 'sm' ? 'h-6 min-w-6 text-xs' : size === 'lg' ? 'h-10 min-w-10 text-lg' : 'h-8 min-w-8 text-sm';
  return (
    <span
      className={`inline-grid place-items-center rounded-lg px-1.5 font-semibold ${dims}`}
      style={{ background: SCORE_COLORS[score], color: score === 'C' ? '#3b2f00' : '#fff' }}
      aria-label={`Nutri-Score ${score}`}
    >
      {score}
    </span>
  );
}

export function NutriScoreScale({ score }: { score: NutriScore | null }) {
  return (
    <div className="inline-flex items-end gap-0.5" aria-label={`Nutri-Score ${score ?? '—'}`}>
      {(Object.keys(SCORE_COLORS) as NutriScore[]).map((s) => (
        <span
          key={s}
          className={`grid place-items-center rounded-md font-semibold text-white transition-all ${
            s === score ? 'h-8 w-7 text-sm ring-2 ring-surface' : 'h-6 w-5 text-[10px] opacity-40'
          }`}
          style={{ background: SCORE_COLORS[s] }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { t } = useI18n();
  const cls =
    status === 'PENDING'
      ? 'bg-warn-50 text-[#a76400] dark:text-accent'
      : status === 'APPROVED'
        ? 'bg-brand-50 text-brand'
        : 'bg-danger-50 text-danger';
  return <span className={`rounded px-2 py-0.5 text-[12px] font-medium ${cls}`}>{t(`status_${status}`)}</span>;
}

export function ProductThumb({ src, alt, className = 'size-14' }: { src: string | null | undefined; alt: string; className?: string }) {
  return src ? (
    <img src={src} alt={alt} className={`${className} shrink-0 rounded-md bg-surface-2 object-cover`} loading="lazy" />
  ) : (
    <div className={`${className} grid shrink-0 place-items-center rounded-md bg-surface-2 text-lg font-semibold text-ink-3`}>
      {alt.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold">{children}</h2>
      {action}
    </div>
  );
}
