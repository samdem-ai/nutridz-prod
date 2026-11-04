import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, NotAdminError } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { ApiError } from '../lib/api';
import { LangSwitch } from '../components/Layout';
import { Spinner } from '../components/ui';

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof NotAdminError) setError(t('notAdmin'));
      else if (err instanceof ApiError && err.status === 0) setError(t('networkError'));
      else if (err instanceof ApiError && (err.status === 401 || err.status === 400 || err.status === 404)) setError(t('badCredentials'));
      else setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.png" alt="" className="size-8 rounded-md" />
            <span className="font-semibold">NutriDz <span className="font-normal text-ink-3">Admin</span></span>
          </div>
          <LangSwitch />
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <h1 className="text-lg font-semibold">{t('loginTitle')}</h1>
            <p className="mt-1 text-sm text-ink-2">{t('loginSubtitle')}</p>
          </div>
          <div>
            <label className="label" htmlFor="email">{t('email')}</label>
            <input id="email" type="email" className="input" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">{t('password')}</label>
            <div className="relative">
              <input id="password" type={show ? 'text' : 'password'} className="input pe-11" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink-3" aria-label="Show password">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {error && <p className="rounded-md bg-danger-50 px-3 py-2.5 text-sm text-danger" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <Spinner size={16} />} {t('signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
