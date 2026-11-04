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
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 pb-8 pt-[max(env(safe-area-inset-top),48px)]">
      <div className="flex flex-col items-center text-center">
        <img src="/icon.png" alt="" className="size-20 rounded-[22%] shadow-[0_1px_3px_rgba(0,0,0,0.12)]" />
        <h1 className="mt-4 text-[28px] font-bold tracking-tight">NutriDz Admin</h1>
        <p className="mt-1 text-[15px] text-ink-3">{t('loginSubtitle')}</p>
      </div>

      <form onSubmit={submit} className="mt-8">
        <div className="group-list">
          <label className="cell">
            <span className="w-28 shrink-0">{t('email')}</span>
            <input type="email" className="field text-start" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.dz" />
          </label>
          <label className="cell">
            <span className="w-28 shrink-0">{t('password')}</span>
            <input type={show ? 'text' : 'password'} className="field text-start" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} className="-me-2 grid size-9 shrink-0 place-items-center text-ink-3" aria-label="Show password">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>
        </div>
        {error && <p className="section-footer text-danger" role="alert">{error}</p>}
        <button type="submit" className="btn-primary mt-6 w-full" disabled={busy}>
          {busy && <Spinner size={18} />} {t('signIn')}
        </button>
      </form>

      <div className="mt-auto pt-10">
        <LangSwitch />
      </div>
    </div>
  );
}
