// Soft dark theme for onboarding. Distinct from main app theme but cohesive.
export const OnboardingColors = {
  bg: '#0F1115', // deep neutral
  bgAlt: '#13161C', // slight elevation
  bgSuccess: '#0F1A14', // dark green-tinted bg for success screens
  surface: '#1A1D24', // card bg
  surfaceElevated: '#22262F', // elevated card / pill
  surfaceMuted: '#171A21',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.10)',

  text: '#F4F5F8',
  textSecondary: '#A8AEBD',
  textMuted: '#6B7180',

  // Match main app brand (green). Was purple `#A78BFA` — unified now.
  primary: '#22C55E',
  primaryMuted: 'rgba(34,197,94,0.18)',
  primaryLight: 'rgba(34,197,94,0.10)',

  success: '#4ADE80',
  successMuted: 'rgba(74,222,128,0.20)',
  warning: '#F59E0B',
  error: '#F87171',
  info: '#60A5FA',

  cta: '#F4F5F8', // light CTA on dark bg
  ctaText: '#0F1115',

  ruler: '#3A3F4B',
  rulerActive: '#22C55E',

  trackBg: '#22262F',
  trackFill: '#4ADE80',
};

export const OnboardingShadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  cta: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};
