import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="text-ink-3">{icon}</div>
      <p className="text-[17px] text-ink-3">{text}</p>
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
  const dot = status === 'PENDING' ? 'bg-[#ff9500]' : status === 'APPROVED' ? 'bg-[#34c759]' : 'bg-danger';
  return (
    <span className="inline-flex items-center gap-1.5 text-[15px] text-ink-3">
      <span className={`size-2 rounded-full ${dot}`} />
      {t(`status_${status}`)}
    </span>
  );
}

export function ProductThumb({ src, alt, className = 'size-14' }: { src: string | null | undefined; alt: string; className?: string }) {
  return src ? (
    <img src={src} alt={alt} className={`${className} shrink-0 rounded-lg bg-surface-2 object-cover`} loading="lazy" />
  ) : (
    <div className={`${className} grid shrink-0 place-items-center rounded-lg bg-fill text-lg font-semibold text-ink-3`}>
      {alt.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="section-header">{children}</h2>
      {action && <div className="pb-1.5 pe-4 text-[15px]">{action}</div>}
    </div>
  );
}

/** Large-title page header, with optional trailing action. */
export function PageTitle({ children, action, subtitle }: { children: ReactNode; action?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h1 className="large-title">{children}</h1>
        {subtitle && <p className="mt-0.5 text-[15px] text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** "‹ Back" navigation link like a UINavigationBar. */
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="link -ms-1.5 mb-2 inline-flex min-h-11 items-center gap-0.5 text-[17px]">
      <ChevronLeft size={26} strokeWidth={2.2} className="rtl:rotate-180" />
      {label}
    </Link>
  );
}

/** Chevron used at the end of tappable rows. */
export function Chevron() {
  return <ChevronRight size={18} className="shrink-0 text-ink-3/70 rtl:rotate-180" />;
}
