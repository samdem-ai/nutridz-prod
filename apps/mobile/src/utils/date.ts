/**
 * Returns YYYY-MM-DD in the user's LOCAL timezone.
 *
 * Why not `new Date().toISOString().split('T')[0]`?
 *   toISOString() returns UTC date. For users in UTC+1 (Algeria), local
 *   midnight = previous-day UTC 23:00 → wrong date string. Journal and
 *   camera ended up querying/writing different dates.
 */
export const localDateStr = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};
