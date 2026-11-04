import { useEffect, useState } from 'react';

export type ThemePref = 'auto' | 'light' | 'dark';
const KEY = 'nutridz_admin_theme';

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function apply(pref: ThemePref) {
  if (pref === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = pref;
}

// Apply before first render to avoid a flash
apply(read());

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(read);
  useEffect(() => {
    apply(pref);
    try {
      if (pref === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, pref);
    } catch {
      /* ignore */
    }
  }, [pref]);
  return { pref, setPref };
}
