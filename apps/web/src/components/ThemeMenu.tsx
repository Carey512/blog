import { Check, ChevronDown, Palette } from 'lucide-react';
import { useState } from 'react';
import { messages } from '../i18n';
import { themes, type ThemeName } from '../theme';
import { usePreferences } from '../context/preferences';

export function ThemeMenu() {
  const { locale, setTheme, theme } = usePreferences();
  const [open, setOpen] = useState(false);
  const t = messages[locale];
  const activeTheme = themes.find((item) => item.id === theme) ?? themes[0];

  function selectTheme(nextTheme: ThemeName) {
    setTheme(nextTheme);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t.themeLabel}
        className="inline-flex h-11 min-w-48 items-center gap-3 rounded-lg border border-border bg-surface px-3 text-left text-sm font-semibold text-foreground shadow-line transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="flex h-5 w-12 overflow-hidden rounded-full ring-1 ring-border">
          {activeTheme.swatches.map((color) => (
            <span className="h-full flex-1" key={color} style={{ backgroundColor: color }} />
          ))}
        </span>
        <span className="min-w-0 flex-1 truncate">{activeTheme.label[locale]}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          className="absolute right-0 z-30 mt-2 grid max-h-[70vh] w-72 gap-1 overflow-auto rounded-lg border border-border bg-surface p-2 shadow-soft"
          role="listbox"
        >
          {themes.map((item) => {
            const active = item.id === theme;

            return (
              <button
                aria-selected={active}
                className={`grid w-full grid-cols-[48px_minmax(0,1fr)_20px] items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                  active ? 'bg-surface-muted text-foreground' : 'text-muted hover:bg-background hover:text-foreground'
                }`}
                key={item.id}
                onClick={() => selectTheme(item.id)}
                role="option"
                type="button"
              >
                <span className="flex h-7 overflow-hidden rounded-md ring-1 ring-border">
                  {item.swatches.map((color) => (
                    <span className="h-full flex-1" key={color} style={{ backgroundColor: color }} />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{item.label[locale]}</span>
                  <span className="block truncate text-xs text-muted">{item.description[locale]}</span>
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
