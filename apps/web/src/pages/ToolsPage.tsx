import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Clock3,
  Copy,
  Download,
  FileText,
  Globe2,
  Link2,
  Loader2,
  MapPin,
  Network,
  Play,
  QrCode,
  RefreshCcw,
  Search,
  Server,
  Square,
  UserRound,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Locale } from '@blog/shared';
import { ModulePageHeader } from '../components/ModulePageHeader';
import { usePreferences } from '../context/preferences';
import { messages, type LocaleMessages } from '../i18n';

type TimestampUnit = 'seconds' | 'milliseconds';
type ToolTab = 'single' | 'batch';
type QrMode = 'contact' | 'text' | 'url' | 'wifi';
type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

type IpInfoResponse = {
  abuse?: {
    address?: string;
    country?: string;
    email?: string;
    name?: string;
    network?: string;
    phone?: string;
  };
  anycast?: boolean;
  asn?: {
    asn?: string;
    domain?: string;
    name?: string;
    route?: string;
    type?: string;
  };
  bogon?: boolean;
  city?: string;
  company?: {
    domain?: string;
    name?: string;
    type?: string;
  };
  country?: string;
  domains?: {
    domains?: string[];
    total?: number;
  };
  error?: {
    message?: string;
    title?: string;
  };
  hostname?: string;
  ip?: string;
  loc?: string;
  org?: string;
  postal?: string;
  privacy?: {
    hosting?: boolean;
    proxy?: boolean;
    relay?: boolean;
    service?: string;
    tor?: boolean;
    vpn?: boolean;
  };
  readme?: string;
  region?: string;
  timezone?: string;
};

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
  const toolCards = [
    {
      Icon: Clock3,
      intro: t.timestampToolIntro,
      path: '/tools/timestamp',
      title: t.timestampToolTitle,
      tone: 'primary' as const,
    },
    {
      Icon: Globe2,
      intro: t.ipToolIntro,
      path: '/tools/ip-lookup',
      title: t.ipToolTitle,
      tone: 'accent' as const,
    },
    {
      Icon: QrCode,
      intro: t.qrToolIntro,
      path: '/tools/qr-code',
      title: t.qrToolTitle,
      tone: 'primary' as const,
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-8 pt-4 sm:px-5 lg:px-6">
      <ModulePageHeader
        count={toolCards.length}
        countLabel={t.toolsCount}
        eyebrow={t.nav.tools}
        intro={t.toolsIntro}
        title={t.toolsTitle}
      />

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {toolCards.map((tool) => (
          <ToolListCard
            Icon={tool.Icon}
            intro={tool.intro}
            key={tool.path}
            locale={locale}
            path={tool.path}
            title={tool.title}
            tone={tool.tone}
          />
        ))}
      </section>
    </main>
  );
}

export function TimestampToolPage() {
  const { locale } = usePreferences();
  const t = messages[locale];

  return (
    <ToolDetailShell
      countLabel={t.toolsCount}
      eyebrow={t.nav.tools}
      intro={t.timestampToolIntro}
      title={t.timestampToolTitle}
    >
      <TimestampToolCard locale={locale} />
    </ToolDetailShell>
  );
}

export function IpLookupToolPage() {
  const { locale } = usePreferences();
  const t = messages[locale];

  return (
    <ToolDetailShell
      countLabel={t.toolsCount}
      eyebrow={t.nav.tools}
      intro={t.ipToolIntro}
      title={t.ipToolTitle}
    >
      <IpLookupToolCard locale={locale} />
    </ToolDetailShell>
  );
}

export function QrCodeToolPage() {
  const { locale } = usePreferences();
  const t = messages[locale];

  return (
    <ToolDetailShell
      countLabel={t.toolsCount}
      eyebrow={t.nav.tools}
      intro={t.qrToolIntro}
      title={t.qrToolTitle}
    >
      <QrCodeToolCard locale={locale} />
    </ToolDetailShell>
  );
}

function ToolDetailShell({
  children,
  countLabel,
  eyebrow,
  intro,
  title,
}: {
  children: ReactNode;
  countLabel: string;
  eyebrow: string;
  intro: string;
  title: string;
}) {
  const { locale } = usePreferences();
  const t = messages[locale];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-8 pt-4 sm:px-5 lg:px-6">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-foreground"
        to="/tools"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.toolsBackToList}
      </Link>
      <ModulePageHeader
        count={1}
        countLabel={countLabel}
        eyebrow={eyebrow}
        intro={intro}
        title={title}
      />
      {children}
    </main>
  );
}

function ToolListCard({
  Icon,
  intro,
  locale,
  path,
  title,
  tone,
}: {
  Icon: LucideIcon;
  intro: string;
  locale: Locale;
  path: string;
  title: string;
  tone: 'accent' | 'primary';
}) {
  const t = messages[locale];
  const iconClassName =
    tone === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground';

  return (
    <article className="rounded-lg border border-border bg-surface p-3 shadow-line transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link className="flex min-h-36 flex-col justify-between" to={path}>
        <div>
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconClassName}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
            {title}
          </h2>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
            {intro}
          </p>
        </div>
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          {t.toolsOpenAction}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </Link>
    </article>
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
    <article id="timestamp" className="overflow-hidden rounded-lg border border-border bg-surface shadow-line">
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

function IpLookupToolCard({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IpInfoResponse | null>(null);

  async function handleLookup(useCurrentIp = false) {
    setError('');
    setLoading(true);

    try {
      const nextResult = await lookupIpInfo(useCurrentIp ? '' : input);
      setResult(nextResult);
    } catch {
      setResult(null);
      setError(t.ipLookupError);
    } finally {
      setLoading(false);
    }
  }

  async function copyJson() {
    if (!result) {
      return;
    }

    const value = JSON.stringify(result, null, 2);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        copyWithTextarea(value);
      }
    } catch {
      copyWithTextarea(value);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article id="ip-lookup" className="overflow-hidden rounded-lg border border-border bg-surface shadow-line">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/40 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Globe2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-foreground">
              {t.ipToolTitle}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted">{t.ipToolIntro}</p>
          </div>
        </div>
        <a
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-background px-2.5 text-xs font-semibold text-primary transition hover:text-foreground"
          href="https://ipinfo.io/"
          rel="noreferrer"
          target="_blank"
        >
          <Network className="h-3.5 w-3.5" aria-hidden="true" />
          {t.ipLookupSource}
        </a>
      </header>

      <section className="p-3">
        <form
          className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_112px_128px]"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLookup(false);
          }}
        >
          <label className="block text-sm font-medium text-foreground">
            {t.ipLookupInputLabel}
            <input
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.ipLookupPlaceholder}
              value={input}
            />
          </label>
          <button
            className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            {loading ? t.ipLookupLoading : t.ipLookupSearchAction}
          </button>
          <button
            className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={() => void handleLookup(true)}
            type="button"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {t.ipLookupCurrentAction}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
            {error}
          </p>
        ) : null}

        {result ? (
          <IpLookupResult
            copied={copied}
            locale={locale}
            onCopyJson={copyJson}
            result={result}
            t={t}
          />
        ) : (
          <section className="mt-4 rounded-lg border border-border bg-background p-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Server className="h-4 w-4 text-muted" aria-hidden="true" />
              {t.ipLookupResultTitle}
            </h3>
            <p className="mt-3 rounded-lg bg-surface-muted px-3 py-6 text-center text-sm text-muted">
              {t.ipLookupEmptyHint}
            </p>
          </section>
        )}
      </section>
    </article>
  );
}

function QrCodeToolCard({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [contactEmail, setContactEmail] = useState('hello@example.com');
  const [contactName, setContactName] = useState('Echo Journal');
  const [contactPhone, setContactPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [errorLevel, setErrorLevel] = useState<QrErrorCorrectionLevel>('M');
  const [foregroundColor, setForegroundColor] = useState('#111827');
  const [margin, setMargin] = useState(2);
  const [mode, setMode] = useState<QrMode>('url');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [size, setSize] = useState(280);
  const [textValue, setTextValue] = useState('Echo Journal');
  const [urlValue, setUrlValue] = useState(() => getInitialQrUrl());
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const payload = useMemo(
    () =>
      buildQrPayload({
        contactEmail,
        contactName,
        contactPhone,
        mode,
        textValue,
        urlValue,
        wifiEncryption,
        wifiPassword,
        wifiSsid,
      }),
    [
      contactEmail,
      contactName,
      contactPhone,
      mode,
      textValue,
      urlValue,
      wifiEncryption,
      wifiPassword,
      wifiSsid,
    ],
  );
  const modeOptions: Array<{ Icon: LucideIcon; label: string; value: QrMode }> = [
    { Icon: Link2, label: t.qrModeUrl, value: 'url' },
    { Icon: FileText, label: t.qrModeText, value: 'text' },
    { Icon: UserRound, label: t.qrModeContact, value: 'contact' },
    { Icon: Wifi, label: t.qrModeWifi, value: 'wifi' },
  ];

  useEffect(() => {
    void generateQr();
  }, [backgroundColor, errorLevel, foregroundColor, margin, payload, size]);

  async function generateQr() {
    if (!payload.trim()) {
      setError(t.qrEmptyValue);
      setQrDataUrl('');
      setQrSvg('');
      return;
    }

    try {
      setError('');
      const options = {
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
        errorCorrectionLevel: errorLevel,
        margin,
        width: size,
      };
      const [nextDataUrl, nextSvg] = await Promise.all([
        QRCode.toDataURL(payload, options),
        QRCode.toString(payload, {
          ...options,
          type: 'svg' as const,
        }),
      ]);

      setQrDataUrl(nextDataUrl);
      setQrSvg(nextSvg);
    } catch {
      setError(t.qrGenerateError);
      setQrDataUrl('');
      setQrSvg('');
    }
  }

  function resetQr() {
    setBackgroundColor('#ffffff');
    setContactEmail('hello@example.com');
    setContactName('Echo Journal');
    setContactPhone('');
    setErrorLevel('M');
    setForegroundColor('#111827');
    setMargin(2);
    setMode('url');
    setSize(280);
    setTextValue('Echo Journal');
    setUrlValue(getInitialQrUrl());
    setWifiEncryption('WPA');
    setWifiPassword('');
    setWifiSsid('');
  }

  function downloadQr(format: 'png' | 'svg') {
    if (format === 'png' && qrDataUrl) {
      downloadDataUrl(qrDataUrl, `echo-qr-${mode}.png`);
      return;
    }

    if (format === 'svg' && qrSvg) {
      downloadTextFile(qrSvg, `echo-qr-${mode}.svg`, 'image/svg+xml;charset=utf-8');
    }
  }

  async function copyPayload() {
    if (!payload.trim()) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        copyWithTextarea(payload);
      }
    } catch {
      copyWithTextarea(payload);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article id="qr-code" className="overflow-hidden rounded-lg border border-border bg-surface shadow-line">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/40 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-foreground">
              {t.qrToolTitle}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted">{t.qrToolIntro}</p>
          </div>
        </div>
        <a
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-background px-2.5 text-xs font-semibold text-primary transition hover:text-foreground"
          href="https://cli.im/"
          rel="noreferrer"
          target="_blank"
        >
          <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
          cli.im
        </a>
      </header>

      <section className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto border-b border-border">
            {modeOptions.map((item) => (
              <button
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 border-b-2 px-3 text-sm font-semibold transition ${
                  mode === item.value
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
                key={item.value}
                onClick={() => setMode(item.value)}
                type="button"
              >
                <item.Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>

          <section className="rounded-lg border border-border bg-background p-3">
            {mode === 'url' ? (
              <QrTextArea
                label={t.qrInputLabel}
                onChange={setUrlValue}
                placeholder={t.qrUrlPlaceholder}
                value={urlValue}
              />
            ) : null}

            {mode === 'text' ? (
              <QrTextArea
                label={t.qrInputLabel}
                onChange={setTextValue}
                placeholder={t.qrTextPlaceholder}
                value={textValue}
              />
            ) : null}

            {mode === 'contact' ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <QrInput label={t.qrContactName} onChange={setContactName} value={contactName} />
                <QrInput label={t.qrContactPhone} onChange={setContactPhone} value={contactPhone} />
                <QrInput label={t.qrContactEmail} onChange={setContactEmail} type="email" value={contactEmail} />
              </div>
            ) : null}

            {mode === 'wifi' ? (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
                <QrInput label={t.qrWifiSsid} onChange={setWifiSsid} value={wifiSsid} />
                <QrInput label={t.qrWifiPassword} onChange={setWifiPassword} value={wifiPassword} />
                <label className="block text-sm font-medium text-foreground">
                  {t.qrWifiEncryption}
                  <select
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => setWifiEncryption(event.target.value)}
                    value={wifiEncryption}
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">{t.qrWifiNone}</option>
                  </select>
                </label>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                onClick={() => void generateQr()}
                type="button"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                {t.qrGenerateAction}
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-muted transition hover:text-foreground"
                onClick={copyPayload}
                type="button"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? t.qrCopied : t.qrCopyPayload}
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-muted transition hover:text-foreground"
                onClick={resetQr}
                type="button"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                {t.qrReset}
              </button>
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm font-medium text-foreground">
              {t.qrForeground}
              <input
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2"
                onChange={(event) => setForegroundColor(event.target.value)}
                type="color"
                value={foregroundColor}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              {t.qrBackground}
              <input
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2"
                onChange={(event) => setBackgroundColor(event.target.value)}
                type="color"
                value={backgroundColor}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              {t.qrSize}: {size}px
              <input
                className="mt-2 w-full accent-primary"
                max="480"
                min="180"
                onChange={(event) => setSize(Number(event.target.value))}
                step="20"
                type="range"
                value={size}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              {t.qrErrorLevel}
              <select
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setErrorLevel(event.target.value as QrErrorCorrectionLevel)}
                value={errorLevel}
              >
                <option value="L">L</option>
                <option value="M">M</option>
                <option value="Q">Q</option>
                <option value="H">H</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground md:col-span-2 xl:col-span-4">
              {t.qrMargin}: {margin}
              <input
                className="mt-2 w-full accent-primary"
                max="6"
                min="0"
                onChange={(event) => setMargin(Number(event.target.value))}
                type="range"
                value={margin}
              />
            </label>
          </section>

          {error ? (
            <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
              {error}
            </p>
          ) : null}
        </div>

        <aside className="rounded-lg border border-border bg-background p-3">
          <h3 className="text-base font-semibold text-foreground">{t.qrPreviewTitle}</h3>
          <div className="mt-3 grid aspect-square place-items-center rounded-lg border border-border bg-white p-4">
            {qrDataUrl ? (
              <img
                alt={t.qrPreviewTitle}
                className="h-full max-h-[300px] w-full max-w-[300px] object-contain"
                src={qrDataUrl}
              />
            ) : (
              <QrCode className="h-28 w-28 text-slate-200" aria-hidden="true" />
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!qrDataUrl}
              onClick={() => downloadQr('png')}
              type="button"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {t.qrDownloadPng}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!qrSvg}
              onClick={() => downloadQr('svg')}
              type="button"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {t.qrDownloadSvg}
            </button>
          </div>
          <p className="mt-3 line-clamp-5 rounded-lg bg-surface-muted px-3 py-2 font-mono text-xs leading-5 text-muted">
            {payload || t.qrEmptyPreview}
          </p>
        </aside>
      </section>
    </article>
  );
}

function QrInput({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function QrTextArea({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <textarea
        className="mt-1 min-h-44 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function buildQrPayload({
  contactEmail,
  contactName,
  contactPhone,
  mode,
  textValue,
  urlValue,
  wifiEncryption,
  wifiPassword,
  wifiSsid,
}: {
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  mode: QrMode;
  textValue: string;
  urlValue: string;
  wifiEncryption: string;
  wifiPassword: string;
  wifiSsid: string;
}) {
  if (mode === 'url') {
    return normalizeQrUrl(urlValue);
  }

  if (mode === 'contact') {
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contactName.trim()}`,
      contactPhone.trim() ? `TEL:${contactPhone.trim()}` : '',
      contactEmail.trim() ? `EMAIL:${contactEmail.trim()}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (mode === 'wifi') {
    const encryption = wifiEncryption === 'nopass' ? 'nopass' : wifiEncryption;
    return `WIFI:T:${escapeWifiValue(encryption)};S:${escapeWifiValue(wifiSsid)};P:${escapeWifiValue(wifiPassword)};;`;
  }

  return textValue.trim();
}

function normalizeQrUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function escapeWifiValue(value: string) {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

function getInitialQrUrl() {
  if (typeof window === 'undefined') {
    return 'https://example.com';
  }

  return window.location.origin;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function downloadTextFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

function IpLookupResult({
  copied,
  locale,
  onCopyJson,
  result,
  t,
}: {
  copied: boolean;
  locale: Locale;
  onCopyJson: () => Promise<void>;
  result: IpInfoResponse;
  t: LocaleMessages;
}) {
  const asn = getAsnInfo(result);
  const mapData = parseCoordinates(result.loc);
  const summaryRows = [
    { label: t.ipLookupLocation, value: formatIpLocation(result, locale) },
    { label: t.ipLookupAsn, value: formatAsnLine(asn) },
    { label: t.ipLookupHostname, value: result.hostname },
    { label: t.ipLookupRange, value: result.asn?.route ?? getIpRange(result.ip) },
    { label: t.ipLookupCompany, value: result.company?.name ?? asn.name },
    { label: t.ipLookupHostedDomains, value: formatHostedDomains(result) },
    { label: t.ipLookupPrivacy, value: formatPrivacy(result) },
    { label: t.ipLookupAnycast, value: formatBoolean(result.anycast) },
    { label: t.ipLookupAsType, value: result.asn?.type ?? result.company?.type ?? getInferredAsType(result) },
    { label: t.ipLookupAbuseContact, value: getAbuseContact(result) },
  ];
  const geolocationRows = [
    { label: t.ipLookupCity, value: result.city },
    { label: t.ipLookupState, value: result.region },
    { label: t.ipLookupCountry, value: formatCountry(result.country, locale) },
    { label: t.ipLookupPostal, value: result.postal },
    { label: t.ipLookupLocalTime, value: formatIpLocalTime(result.timezone, locale) },
    { label: t.ipLookupTimezone, value: result.timezone },
    { label: t.ipLookupCoordinates, value: formatCoordinates(result.loc) },
  ];

  return (
    <section className="mt-4 space-y-3">
      <div className="rounded-lg border border-border bg-background p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {t.ipLookupResultTitle}
            </p>
            <h3 className="mt-2 break-all font-mono text-3xl font-semibold leading-tight text-foreground">
              {result.ip ?? '-'}
            </h3>
            <p className="mt-1 text-sm font-semibold text-muted">
              {t.ipLookupIpv6}: {result.ip?.includes(':') ? result.ip : t.ipLookupNotDetected}
            </p>
          </div>
          <span className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground">
            {result.asn?.type ?? result.company?.type ?? getInferredAsType(result) ?? '-'}
          </span>
        </div>
      </div>

      <IpInfoTable rows={summaryRows} title={t.ipLookupSummaryTitle} />

      <section className="rounded-lg border border-border bg-background p-3">
        <h3 className="text-lg font-semibold text-foreground">
          {t.ipLookupGeolocationTitle}
        </h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <IpInfoRows rows={geolocationRows} />
          <div className="min-w-0">
            {mapData ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  className="h-64 w-full"
                  loading="lazy"
                  src={createOpenStreetMapEmbedUrl(mapData.lat, mapData.lng)}
                  title={`${t.ipLookupCoordinates} ${result.loc}`}
                />
                <div className="flex items-center justify-between gap-2 bg-surface-muted px-3 py-2 text-sm font-semibold text-foreground">
                  <span className="font-mono">
                    {formatCoordinates(result.loc)}
                  </span>
                  <a
                    className="inline-flex items-center gap-1 text-primary transition hover:text-foreground"
                    href={createOpenStreetMapLink(mapData.lat, mapData.lng)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t.ipLookupOpenMap}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-surface-muted px-3 py-8 text-center text-sm text-muted">
                -
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            {t.ipLookupRaw}
          </h3>
          <button
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold text-muted transition hover:text-foreground"
            onClick={() => void onCopyJson()}
            type="button"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? t.timestampCopied : t.timestampCopy}
          </button>
        </div>
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-surface-muted p-3 text-xs leading-5 text-foreground">
          {JSON.stringify(result, null, 2)}
        </pre>
      </section>
    </section>
  );
}

function IpInfoTable({
  rows,
  title,
}: {
  rows: Array<{ label: string; value?: boolean | number | string }>;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        <IpInfoRows rows={rows} />
      </div>
    </section>
  );
}

function IpInfoRows({
  rows,
}: {
  rows: Array<{ label: string; value?: boolean | number | string }>;
}) {
  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div
          className="grid gap-1 bg-surface px-3 py-2 odd:bg-surface-muted/45 sm:grid-cols-[180px_minmax(0,1fr)]"
          key={row.label}
        >
          <span className="text-sm font-medium text-muted">{row.label}</span>
          <span className="break-words font-mono text-sm text-foreground">
            {formatMaybeValue(row.value)}
          </span>
        </div>
      ))}
    </div>
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

async function lookupIpInfo(input: string) {
  const ip = input.trim();
  const endpoint = ip
    ? `https://ipinfo.io/${encodeURIComponent(ip)}/json`
    : 'https://ipinfo.io/json';
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });
  const data = (await response.json()) as IpInfoResponse;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? 'IP lookup failed');
  }

  return data;
}

function getAsnInfo(result: IpInfoResponse) {
  const parsedOrg = parseOrgAsn(result.org);

  return {
    asn: result.asn?.asn ?? parsedOrg.asn,
    name: result.asn?.name ?? result.company?.name ?? parsedOrg.name,
  };
}

function parseOrgAsn(org?: string) {
  const match = org?.match(/^(AS\d+)\s+(.+)$/i);

  return {
    asn: match?.[1],
    name: match?.[2] ?? org,
  };
}

function formatAsnLine(asn: { asn?: string; name?: string }) {
  return [asn.asn, asn.name].filter(Boolean).join(' - ');
}

function getIpRange(ip?: string) {
  if (!ip) {
    return undefined;
  }

  if (ip.includes(':')) {
    const segments = ip.split(':').filter(Boolean);
    return segments.length ? `${segments.slice(0, 4).join(':')}::/64` : undefined;
  }

  const parts = ip.split('.');

  if (parts.length !== 4) {
    return undefined;
  }

  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

function formatHostedDomains(result: IpInfoResponse) {
  if (typeof result.domains?.total === 'number') {
    return result.domains.total;
  }

  return undefined;
}

function formatPrivacy(result: IpInfoResponse) {
  if (!result.privacy) {
    return undefined;
  }

  return Boolean(
    result.privacy.vpn ||
      result.privacy.proxy ||
      result.privacy.tor ||
      result.privacy.relay ||
      result.privacy.hosting ||
      result.privacy.service,
  );
}

function formatBoolean(value?: boolean) {
  return typeof value === 'boolean' ? value : undefined;
}

function getInferredAsType(result: IpInfoResponse) {
  const value = `${result.asn?.name ?? ''} ${result.company?.name ?? ''} ${result.org ?? ''}`.toLowerCase();

  if (/hosting|cloud|network|digitalocean|amazon|google|microsoft|akamai|akari|data center|datacenter/.test(value)) {
    return 'Hosting';
  }

  return undefined;
}

function getAbuseContact(result: IpInfoResponse) {
  return result.abuse?.email ?? result.abuse?.phone ?? result.abuse?.name;
}

function formatIpLocation(result: IpInfoResponse, locale: Locale) {
  return [
    result.city,
    result.region,
    formatCountry(result.country, locale),
  ]
    .filter(Boolean)
    .join(', ');
}

function formatCountry(countryCode: string | undefined, locale: Locale) {
  if (!countryCode) {
    return undefined;
  }

  const regionNames = new Intl.DisplayNames([locale], { type: 'region' });
  const countryName = regionNames.of(countryCode.toUpperCase()) ?? countryCode;

  return `${countryFlag(countryCode)} ${countryName}`;
}

function countryFlag(countryCode: string) {
  const code = countryCode.toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    return '';
  }

  return String.fromCodePoint(
    ...code.split('').map((letter) => 127397 + letter.charCodeAt(0)),
  );
}

function formatIpLocalTime(timeZone: string | undefined, locale: Locale) {
  if (!timeZone) {
    return undefined;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  }).format(new Date());
}

function parseCoordinates(value?: string) {
  const [latText, lngText] = value?.split(',') ?? [];
  const lat = Number(latText);
  const lng = Number(lngText);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function formatCoordinates(value?: string) {
  const coordinates = parseCoordinates(value);

  if (!coordinates) {
    return undefined;
  }

  return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
}

function createOpenStreetMapEmbedUrl(lat: number, lng: number) {
  const delta = 0.08;
  const bbox = [
    lng - delta,
    lat - delta,
    lng + delta,
    lat + delta,
  ].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

function createOpenStreetMapLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=12/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
}

function formatMaybeValue(value?: boolean | number | string) {
  if (value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  return value;
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
