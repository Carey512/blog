import { LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';

export function LoginPage() {
  const { isAuthenticated, login, logout, register, user } = useAuth();
  const { locale } = usePreferences();
  const t = messages[locale];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectTo = searchParams.get('redirect') ?? '/articles';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch {
      setError(mode === 'register' ? t.registerError : t.loginError);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setError('');
    setMode((current) => (current === 'login' ? 'register' : 'login'));
  }

  if (isAuthenticated && user) {
    return (
      <main className="mx-auto grid w-full max-w-4xl flex-1 place-items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl rounded-lg border border-border bg-surface p-6 shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-foreground">{t.loggedInTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {t.loggedInAs} {user.name}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              to="/articles"
            >
              {t.nav.articles}
            </Link>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-muted"
              onClick={logout}
              type="button"
            >
              {t.logoutAction}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-4xl flex-1 place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <form className="w-full max-w-xl rounded-lg border border-border bg-surface p-6 shadow-soft" onSubmit={handleSubmit}>
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
          <LockKeyhole className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold text-foreground">
          {mode === 'register' ? t.registerTitle : t.loginTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {mode === 'register' ? t.registerIntro : t.loginIntro}
        </p>

        {mode === 'register' ? (
          <label className="mt-6 block text-sm font-medium text-foreground">
            {t.nameLabel}
            <input
              className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>
        ) : null}

        <label className={`${mode === 'register' ? 'mt-4' : 'mt-6'} block text-sm font-medium text-foreground`}>
          {t.emailLabel}
          <input
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-foreground">
          {t.passwordLabel}
          <input
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="mt-3 text-sm font-medium text-accent">{error}</p> : null}

        <button
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {mode === 'register' ? (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )}
          {loading
            ? mode === 'register'
              ? t.registerLoading
              : t.loginLoading
            : mode === 'register'
              ? t.registerAction
              : t.loginAction}
        </button>

        <button
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-muted transition hover:text-foreground"
          onClick={toggleMode}
          type="button"
        >
          {mode === 'register' ? t.switchToLogin : t.switchToRegister}
        </button>
      </form>
    </main>
  );
}
