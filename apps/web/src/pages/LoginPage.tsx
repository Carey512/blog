import { LockKeyhole, LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';

export function LoginPage() {
  const { isAuthenticated, login, logout, user } = useAuth();
  const { locale } = usePreferences();
  const t = messages[locale];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('author@example.com');
  const [password, setPassword] = useState('author123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectTo = searchParams.get('redirect') ?? '/submit';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      setError(t.loginError);
    } finally {
      setLoading(false);
    }
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
              to="/submit"
            >
              {t.nav.submit}
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
        <h1 className="mt-5 text-3xl font-semibold text-foreground">{t.loginTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{t.loginIntro}</p>

        <label className="mt-6 block text-sm font-medium text-foreground">
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
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {loading ? t.loginLoading : t.loginAction}
        </button>
      </form>
    </main>
  );
}
