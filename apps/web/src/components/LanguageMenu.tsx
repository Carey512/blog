import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@blog/shared';
import { locales, messages } from '../i18n';
import { usePreferences } from '../context/preferences';

export function LanguageMenu() {
  const { locale, setLocale } = usePreferences();
  const [open, setOpen] = useState(false);
  const t = messages[locale];
  const activeLocale = locales.find((item) => item.id === locale) ?? locales[0];

  function selectLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t.languageLabel}
        className="inline-flex h-11 items-center gap-3 rounded-lg border border-border bg-surface px-3 text-left text-sm font-semibold text-foreground shadow-line transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          {activeLocale.shortLabel}
        </span>
        <span className="hidden min-w-16 sm:block">{activeLocale.label}</span>
        <Globe2 className="h-4 w-4 text-primary sm:hidden" aria-hidden="true" />
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-border bg-surface p-2 shadow-soft"
          role="listbox"
        >
          {locales.map((item) => {
            const active = item.id === locale;

            return (
              <button
                aria-selected={active}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                  active ? 'bg-surface-muted text-foreground' : 'text-muted hover:bg-background hover:text-foreground'
                }`}
                key={item.id}
                onClick={() => selectLocale(item.id)}
                role="option"
                type="button"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  {item.shortLabel}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-muted">{item.description}</span>
                </span>
                {active ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
