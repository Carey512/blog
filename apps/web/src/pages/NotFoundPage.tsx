import { Link } from 'react-router-dom';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';

export function NotFoundPage() {
  const { locale } = usePreferences();
  const t = messages[locale];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-border bg-surface p-8 text-center shadow-line">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">{t.notFoundTitle}</h1>
        <p className="mt-3 text-muted">{t.notFoundBody}</p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          to="/"
        >
          {t.backHome}
        </Link>
      </div>
    </main>
  );
}
