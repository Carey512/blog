import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { LanguageMenu } from './LanguageMenu';
import { ThemeMenu } from './ThemeMenu';
import { useAuth } from '../context/auth';
import { messages } from '../i18n';
import { navigationPages } from '../router/pageRegistry';
import { usePreferences } from '../context/preferences';

export function AppLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const { locale } = usePreferences();
  const t = messages[locale];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-20 border-b border-border bg-background/92 shadow-line backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <NavLink className="font-serif text-2xl font-semibold tracking-normal text-foreground" to="/">
              {t.brand}
            </NavLink>
            <div className="lg:hidden">
              <LanguageMenu />
            </div>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto text-sm font-medium text-muted lg:justify-center">
            {navigationPages.map((page) => (
              <NavLink
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-primary ${
                    isActive ? 'bg-surface-muted text-foreground' : 'hover:bg-surface hover:text-foreground'
                  }`
                }
                key={page.path}
                to={page.path}
              >
                {page.navKey ? t.nav[page.navKey] : page.path}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden lg:block">
              <LanguageMenu />
            </div>
            <ThemeMenu />
            {user ? (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-muted transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={logout}
                type="button"
              >
                <span className="max-w-28 truncate">{user.name}</span>
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <NavLink
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
                to="/login"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {t.loginAction}
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span className="font-serif text-lg font-semibold text-foreground">{t.brand}</span>
          <span>{t.footer}</span>
        </div>
      </footer>
    </div>
  );
}
