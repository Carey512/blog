import {
  Calendar,
  Check,
  Clock3,
  Copy,
  Play,
  RefreshCcw,
  Search,
  Square,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '@blog/shared';
import { ModulePageHeader } from '../components/ModulePageHeader';
import { usePreferences } from '../context/preferences';
import { messages, type LocaleMessages } from '../i18n';

type TimestampUnit = 'seconds' | 'milliseconds';
type ToolTab = 'single' | 'batch';

type TimeZoneOption = {
  label: string;
  value: string;
};

const timeZoneOptions: TimeZoneOption[] = [
  { label: 'Asia/Shanghai', value: 'Asia/Shanghai' },
  { label: 'UTC', value: 'UTC' },
  { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { label: 'Asia/Singapore', value: 'Asia/Singapore' },
  { label: 'Africa/Cairo', value: 'Africa/Cairo' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'Europe/Paris', value: 'Europe/Paris' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'Australia/Sydney', value: 'Australia/Sydney' },
];

export function ToolsPage() {
  const { locale } = usePreferences();
  const t = messages[locale];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-8 pt-4 sm:px-5 lg:px-6">
      <ModulePageHeader
        count={1}
        countLabel={t.toolsCount}
        eyebrow={t.nav.tools}
        intro={t.toolsIntro}
        title={t.toolsTitle}
      />

      <section className="grid grid-cols-1 gap-3">
        <TimestampToolCard locale={locale} />
      </section>
    </main>
  );
}

function TimestampToolCard({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const [activeTab, setActiveTab] = useState<ToolTab>('single');
  const [batchInput, setBatchInput] = useState('1784194714\n1784194732');
  const [batchTimeZone, setBatchTimeZone] = useState('Asia/Shanghai');
  const [batchUnit, setBatchUnit] = useState<TimestampUnit>('seconds');
  const [copiedKey, setCopiedKey] = useState('');
  const [dateInput, setDateInput] = useState(() => formatDateInput(new Date(), 'Asia/Shanghai'));
  const [dateResult, setDateResult] = useState('');
  const [dateResultUnit, setDateResultUnit] = useState<TimestampUnit>('seconds');
  const [dateTimeZone, setDateTimeZone] = useState('Asia/Shanghai');
  const [isRunning, setIsRunning] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [timestampInput, setTimestampInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [timestampResult, setTimestampResult] = useState('');
  const [timestampTimeZone, setTimestampTimeZone] = useState('Asia/Shanghai');
  const [timestampUnit, setTimestampUnit] = useState<TimestampUnit>('seconds');
  const [unit, setUnit] = useState<TimestampUnit>('seconds');

  const currentTimestamp = unit === 'seconds'
    ? String(Math.floor(now.getTime() / 1000))
    : String(now.getTime());
  const batchResult = useMemo(
    () => convertBatchTimestamps(batchInput, batchUnit, batchTimeZone, locale),
    [batchInput, batchTimeZone, batchUnit, locale],
  );

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => setNow(new Date()), unit === 'seconds' ? 1000 : 250);

    return () => window.clearInterval(timer);
  }, [isRunning, unit]);

  function convertTimestampToDate() {
    const date = timestampToDate(timestampInput, timestampUnit);
    setTimestampResult(date ? formatDateTime(date, locale, timestampTimeZone) : t.timestampInvalid);
  }

  function convertDateToTimestamp() {
    const date = zonedDateTextToUtc(dateInput, dateTimeZone);

    if (!date) {
      setDateResult(t.timestampInvalid);
      return;
    }

    setDateResult(
      dateResultUnit === 'seconds'
        ? String(Math.floor(date.getTime() / 1000))
        : String(date.getTime()),
    );
  }

  function fillCurrentDate() {
    const nextDate = new Date();
    setNow(nextDate);
    setDateInput(formatDateInput(nextDate, dateTimeZone));
    setTimestampInput(String(Math.floor(nextDate.getTime() / 1000)));
    setTimestampUnit('seconds');
  }

  async function copyValue(key: string, value: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        copyWithTextarea(value);
      }

      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1400);
    } catch {
      copyWithTextarea(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1400);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-line">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/40 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-foreground">
              {t.timestampToolTitle}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted">{t.timestampToolIntro}</p>
          </div>
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-background px-2.5 text-xs font-semibold text-primary">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          {t.nav.tools}
        </span>
      </header>

      <section className="border-b border-border p-3">
        <h3 className="text-base font-semibold text-foreground">{t.timestampCurrentTitle}</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <p className="font-mono text-3xl leading-none text-foreground">{currentTimestamp}</p>
          <span className="text-sm text-muted">{getUnitSuffix(unit, t)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted transition hover:text-foreground"
            onClick={() => setUnit(unit === 'seconds' ? 'milliseconds' : 'seconds')}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {t.timestampSwitchUnit}
          </button>
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted transition hover:text-foreground"
            onClick={() => copyValue('current', currentTimestamp)}
            type="button"
          >
            {copiedKey === 'current' ? (
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copiedKey === 'current' ? t.timestampCopied : t.timestampCopy}
          </button>
          <button
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition ${
              isRunning
                ? 'bg-red-600 text-white hover:opacity-90'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
            onClick={() => setIsRunning((running) => !running)}
            type="button"
          >
            {isRunning ? <Square className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {isRunning ? t.timestampStop : t.timestampStart}
          </button>
        </div>
      </section>

      <section className="p-3">
        <div className="grid rounded-lg bg-surface-muted p-1 sm:grid-cols-2">
          <button
            className={`h-9 rounded-md text-sm font-semibold transition ${
              activeTab === 'single' ? 'bg-surface text-foreground shadow-line' : 'text-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab('single')}
            type="button"
          >
            {t.timestampSingleConversion}
          </button>
          <button
            className={`h-9 rounded-md text-sm font-semibold transition ${
              activeTab === 'batch' ? 'bg-surface text-foreground shadow-line' : 'text-muted hover:text-foreground'
            }`}
            onClick={() => setActiveTab('batch')}
            type="button"
          >
            {t.timestampBatchConversion}
          </button>
        </div>

        {activeTab === 'single' ? (
          <div className="mt-4 space-y-5">
            <section>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Clock3 className="h-4 w-4 text-muted" aria-hidden="true" />
                {t.timestampToDateTitle}
              </h3>
              <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1.25fr)_124px_80px_minmax(0,1.35fr)_150px]">
                <input
                  className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setTimestampInput(event.target.value)}
                  placeholder={t.timestampInputPlaceholder}
                  value={timestampInput}
                />
                <UnitSelect onChange={setTimestampUnit} t={t} value={timestampUnit} />
                <ConvertButton onClick={convertTimestampToDate} t={t} />
                <ResultField value={timestampResult} placeholder={t.timestampResultPlaceholder} />
                <TimeZoneSelect onChange={setTimestampTimeZone} value={timestampTimeZone} />
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-muted" aria-hidden="true" />
                {t.dateToTimestampTitle}
              </h3>
              <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1.25fr)_172px_80px_minmax(0,1.35fr)_124px]">
                <input
                  className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setDateInput(event.target.value)}
                  placeholder="2026-07-16 17:38:34"
                  value={dateInput}
                />
                <TimeZoneSelect onChange={setDateTimeZone} value={dateTimeZone} />
                <ConvertButton onClick={convertDateToTimestamp} t={t} />
                <ResultField value={dateResult} placeholder={t.timestampResultPlaceholder} />
                <UnitSelect onChange={setDateResultUnit} t={t} value={dateResultUnit} />
              </div>
            </section>

            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted transition hover:text-foreground"
              onClick={fillCurrentDate}
              type="button"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {t.timestampNowAction}
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]">
            <label className="block text-sm font-medium text-foreground">
              {t.timestampBatchInput}
              <textarea
                className="mt-1 min-h-40 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setBatchInput(event.target.value)}
                placeholder={t.timestampBatchPlaceholder}
                value={batchInput}
              />
            </label>
            <div className="grid content-start gap-2 pt-6">
              <UnitSelect onChange={setBatchUnit} t={t} value={batchUnit} />
              <TimeZoneSelect onChange={setBatchTimeZone} value={batchTimeZone} />
            </div>
            <label className="block text-sm font-medium text-foreground">
              {t.timestampBatchResult}
              <textarea
                className="mt-1 min-h-40 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-6 text-muted outline-none"
                readOnly
                value={batchResult}
              />
            </label>
          </div>
        )}
      </section>
    </article>
  );
}

function UnitSelect({
  onChange,
  t,
  value,
}: {
  onChange: (value: TimestampUnit) => void;
  t: LocaleMessages;
  value: TimestampUnit;
}) {
  return (
    <select
      className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      onChange={(event) => onChange(event.target.value as TimestampUnit)}
      value={value}
    >
      <option value="seconds">{t.timestampModeSeconds}</option>
      <option value="milliseconds">{t.timestampModeMilliseconds}</option>
    </select>
  );
}

function TimeZoneSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {timeZoneOptions.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function ConvertButton({ onClick, t }: { onClick: () => void; t: LocaleMessages }) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-3 text-sm font-semibold text-background transition hover:opacity-90"
      onClick={onClick}
      type="button"
    >
      {t.timestampConvert}
    </button>
  );
}

function ResultField({ placeholder, value }: { placeholder: string; value: string }) {
  return (
    <input
      className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
      placeholder={placeholder}
      readOnly
      value={value}
    />
  );
}

function timestampToDate(input: string, unit: TimestampUnit) {
  const value = Number(input.trim());

  if (!Number.isFinite(value)) {
    return null;
  }

  const date = new Date(unit === 'seconds' ? value * 1000 : value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function convertBatchTimestamps(
  input: string,
  unit: TimestampUnit,
  timeZone: string,
  locale: Locale,
) {
  return input
    .split(/\r?\n/)
    .map((line) => {
      const value = line.trim();

      if (!value) {
        return '';
      }

      const date = timestampToDate(value, unit);

      return date ? `${value} -> ${formatDateTime(date, locale, timeZone)}` : `${value} -> invalid`;
    })
    .join('\n');
}

function zonedDateTextToUtc(input: string, timeZone: string) {
  const parts = parseDateParts(input);

  if (!parts) {
    return null;
  }

  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const firstOffset = getTimeZoneOffsetMs(timeZone, new Date(utcGuess));
  const firstResult = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(timeZone, new Date(firstResult));
  const result = utcGuess - secondOffset;
  const date = new Date(result);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateParts(input: string) {
  const match = input
    .trim()
    .match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);

  if (!match) {
    return null;
  }

  return {
    day: Number(match[3]),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
    month: Number(match[2]),
    second: Number(match[6] ?? 0),
    year: Number(match[1]),
  };
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = values.hour === '24' ? 0 : Number(values.hour);
  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    hour,
    Number(values.minute),
    Number(values.second),
  );

  return zonedAsUtc - date.getTime();
}

function formatDateInput(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = values.hour === '24' ? '00' : values.hour;

  return `${values.year}-${values.month}-${values.day} ${hour}:${values.minute}:${values.second}`;
}

function formatDateTime(date: Date, locale: Locale, timeZone: string) {
  const formatted = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    timeZoneName: 'short',
    year: 'numeric',
  }).format(date);

  return `${formatted} (${timeZone})`;
}

function getUnitSuffix(unit: TimestampUnit, t: LocaleMessages) {
  return unit === 'seconds' ? t.timestampSecondSuffix : t.timestampMillisecondSuffix;
}

function copyWithTextarea(value: string) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.left = '-9999px';
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
