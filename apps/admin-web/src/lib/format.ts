import { ApiError } from './api';
import type { TKey } from './i18n';

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  return r.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function timeAgo(iso: string | null | undefined, lang: string): string {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  if (diff < 60) return rtf.format(-Math.round(diff), 'second');
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  return rtf.format(-Math.round(diff / 86400), 'day');
}

export function errorMessage(e: unknown, t: (k: TKey) => string): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return t('networkError');
    if (e.fields) return Object.entries(e.fields).map(([k, v]) => `${k}: ${v}`).join(' · ');
    return e.message || t('genericError');
  }
  return t('genericError');
}
