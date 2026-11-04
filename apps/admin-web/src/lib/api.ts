import type { BarcodeCheck, Food, FoodCategory, LabelOcrResult, Me, Page, ProductPayload, Stats, Submission, SubmissionStatus } from './types';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080/api';

const TOKEN_KEY = 'nutridz_admin_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;
  constructor(status: number, message: string, code?: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(API_BASE_URL + path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, body?.message || res.statusText, body?.errorCode, body?.validationErrors);
  }
  return body as T;
}

const qs = (params: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<Me>('/auth/me'),

  stats: () => request<Stats>('/admin/stats'),
  readLabel: (image: string) =>
    request<LabelOcrResult>('/admin/ocr-label', { method: 'POST', body: JSON.stringify({ image }) }),
  checkBarcode: (code: string) => request<BarcodeCheck>(`/admin/barcode/${encodeURIComponent(code)}`),

  submissions: (params: { status?: SubmissionStatus; q?: string; page?: number; size?: number }) =>
    request<Page<Submission>>(`/admin/submissions${qs(params)}`),
  submission: (id: number) => request<Submission>(`/admin/submissions/${id}`),
  createSubmission: (body: ProductPayload) =>
    request<Submission>('/admin/submissions', { method: 'POST', body: JSON.stringify(body) }),
  updateSubmission: (id: number, body: ProductPayload) =>
    request<Submission>(`/admin/submissions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  approve: (id: number, edits?: ProductPayload) =>
    request<Submission>(`/admin/submissions/${id}/approve`, { method: 'POST', body: edits ? JSON.stringify(edits) : undefined }),
  reject: (id: number, reason: string) =>
    request<Submission>(`/admin/submissions/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reopen: (id: number) => request<Submission>(`/admin/submissions/${id}/reopen`, { method: 'POST' }),
  deleteSubmission: (id: number) => request<void>(`/admin/submissions/${id}`, { method: 'DELETE' }),

  foods: (params: { q?: string; category?: FoodCategory; verified?: boolean; hasBarcode?: boolean; page?: number; size?: number }) =>
    request<Page<Food>>(`/admin/foods${qs(params)}`),
  food: (id: number) => request<Food>(`/admin/foods/${id}`),
  updateFood: (id: number, body: ProductPayload) =>
    request<Food>(`/admin/foods/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setVerified: (id: number, verified: boolean) =>
    request<Food>(`/admin/foods/${id}/verified`, { method: 'PATCH', body: JSON.stringify({ verified }) }),
};
