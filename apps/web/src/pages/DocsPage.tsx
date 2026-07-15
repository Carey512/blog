import { BookOpenText, Search, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { WorkDoc, WorkDocCategory } from '@blog/shared';
import { ModulePageHeader } from '../components/ModulePageHeader';
import { UploadDialog } from '../components/UploadDialog';
import { useAuth } from '../context/auth';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { docsService } from '../services/docsService';

const docCategories: Array<WorkDocCategory | 'all'> = ['all', 'deployment', 'shortcut', 'workflow', 'reference'];

export function DocsPage() {
  const { isAuthenticated, token } = useAuth();
  const { locale } = usePreferences();
  const t = messages[locale];
  const copy = getDocsUploadCopy(locale);
  const [category, setCategory] = useState<WorkDocCategory | 'all'>('all');
  const [docs, setDocs] = useState<WorkDoc[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFormCategory, setDocFormCategory] = useState<WorkDocCategory>('reference');
  const [docSummary, setDocSummary] = useState('');
  const [docTags, setDocTags] = useState('');
  const [docText, setDocText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docUpdatedAt, setDocUpdatedAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) => {
        const translated = doc.content[locale] ?? doc.content['zh-CN'];
        const text = [
          doc.category,
          ...doc.tags,
          translated.title,
          translated.summary,
        ].join(' ').toLowerCase();

        return query.trim() ? text.includes(query.trim().toLowerCase()) : true;
      }),
    [docs, locale, query],
  );

  useEffect(() => {
    let alive = true;

    async function loadDocs() {
      try {
        setLoading(true);
        setError('');
        const nextDocs = await docsService.getDocs({ category });

        if (alive) {
          setDocs(nextDocs);
        }
      } catch {
        if (alive) {
          setDocs([]);
          setError('failed');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadDocs();

    return () => {
      alive = false;
    };
  }, [category]);

  async function handleCreateDoc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('titleZh', docTitle);
    formData.append('titleEn', docTitle);
    formData.append('summaryZh', docSummary);
    formData.append('summaryEn', docSummary);
    formData.append('category', docFormCategory);
    formData.append('updatedAt', docUpdatedAt);
    formData.append('tags', docTags);
    formData.append('textZh', docText);
    formData.append('textEn', docText);

    if (docFile) {
      formData.append('file', docFile);
    }

    try {
      const created = await docsService.createDoc(formData, token);
      setDocs((currentDocs) => [created, ...currentDocs]);
      setSubmitMessage(`${copy.saved}: ${created.content[locale]?.title ?? created.content['zh-CN'].title}`);
      setDocFile(null);
      setDocSummary('');
      setDocTags('');
      setDocText('');
      setDocTitle('');
      setDocUpdatedAt(new Date().toISOString().slice(0, 10));
      setShowUpload(false);
    } catch {
      setSubmitMessage(copy.failed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-8 pt-4 sm:px-5 lg:px-6">
      <ModulePageHeader
        count={docs.length}
        countLabel={t.docsCount}
        eyebrow={t.nav.docs}
        intro={t.docsIntro}
        title={t.docsTitle}
      />

      <section className="space-y-4">
        <DocsFilterBar
          category={category}
          locale={locale}
          onCategoryChange={setCategory}
          onQueryChange={setQuery}
          onUploadClick={() => setShowUpload(true)}
          query={query}
          uploadLabel={isAuthenticated ? copy.upload : copy.loginUpload}
        />

      {submitMessage ? <p className="text-sm font-medium text-primary">{submitMessage}</p> : null}

      {loading || error ? (
        <section className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
          {loading ? t.docsLoading : t.docsLoadError}
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {filteredDocs.length ? (
            filteredDocs.map((doc) => {
              const translated = doc.content[locale] ?? doc.content['zh-CN'];

              return (
                <article
                  className="flex min-h-full flex-col rounded-lg border border-border bg-surface p-3 shadow-line transition hover:-translate-y-0.5 hover:shadow-soft"
                  key={doc.id}
                >
                  <Link className="flex min-h-full flex-col" to={`/docs/${doc.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <BookOpenText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="truncate rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold text-muted">
                        {getDocCategoryLabel(doc.category, locale)}
                      </span>
                    </div>
                    <h2 className="mt-3 line-clamp-2 min-h-11 text-sm font-semibold leading-5 text-foreground sm:text-base">
                      {translated.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted sm:text-sm">
                      {translated.summary}
                    </p>
                    <div className="mt-auto pt-3">
                      <p className="text-xs text-muted">{doc.updatedAt}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {doc.tags.slice(0, 2).map((tag) => (
                          <span className="rounded-md bg-surface-muted px-2 py-1 text-xs text-muted" key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })
          ) : (
            <div className="col-span-2 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted lg:col-span-4">
              {t.docsNoResults}
            </div>
          )}
        </section>
      )}
      </section>

      <UploadDialog onClose={() => setShowUpload(false)} open={showUpload} title={copy.upload}>
        {isAuthenticated ? (
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]" onSubmit={handleCreateDoc}>
            <section className="grid gap-3 sm:grid-cols-2">
              <DocInput label={copy.title} onChange={setDocTitle} required value={docTitle} />
              <DocInput label={copy.date} onChange={setDocUpdatedAt} value={docUpdatedAt} />
              <DocInput label={copy.summary} onChange={setDocSummary} value={docSummary} />
              <DocInput label={copy.tags} onChange={setDocTags} value={docTags} />
              <label className="block text-sm font-medium text-foreground sm:col-span-2">
                {copy.text}
                <textarea
                  className="mt-1 min-h-28 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setDocText(event.target.value)}
                  placeholder={copy.textPlaceholder}
                  value={docText}
                />
              </label>
            </section>
            <aside className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                {copy.category}
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setDocFormCategory(event.target.value as WorkDocCategory)}
                  value={docFormCategory}
                >
                  {docCategories.filter((item) => item !== 'all').map((item) => (
                    <option key={item} value={item}>
                      {getDocCategoryLabel(item, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-foreground">
                {copy.htmlFile}
                <input
                  accept=".html,.htm,text/html"
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground"
                  onChange={(event) => setDocFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {submitting ? copy.saving : copy.submit}
              </button>
            </aside>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted">{copy.loginRequired}</p>
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              to="/login?redirect=/docs"
            >
              {copy.goLogin}
            </Link>
          </div>
        )}
      </UploadDialog>
    </main>
  );
}

function DocsFilterBar({
  category,
  locale,
  onCategoryChange,
  onQueryChange,
  onUploadClick,
  query,
  uploadLabel,
}: {
  category: WorkDocCategory | 'all';
  locale: 'zh-CN' | 'en-US';
  onCategoryChange: (category: WorkDocCategory | 'all') => void;
  onQueryChange: (query: string) => void;
  onUploadClick: () => void;
  query: string;
  uploadLabel: string;
}) {
  const t = messages[locale];

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface p-2 shadow-line">
      <label className="relative min-w-[11rem] max-w-[22rem] flex-[0_0_46%] sm:flex-[0_0_20rem] lg:flex-[0_0_22rem]">
        <span className="sr-only">{t.docsSearchLabel}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.docsSearchPlaceholder}
          value={query}
        />
      </label>

      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
        {docCategories.map((item) => (
          <button
            className={`min-h-10 shrink-0 rounded-lg border px-3 text-sm font-medium transition ${
              category === item
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted hover:text-foreground'
            }`}
            key={item}
            onClick={() => onCategoryChange(item)}
            type="button"
          >
            {getDocCategoryLabel(item, locale)}
          </button>
        ))}
      </div>

      <button
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        onClick={onUploadClick}
        type="button"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {uploadLabel}
      </button>
    </div>
  );
}

export function getDocCategoryLabel(category: WorkDocCategory | 'all', locale: 'zh-CN' | 'en-US') {
  const labels = {
    'zh-CN': {
      all: '\u5168\u90e8',
      deployment: '\u90e8\u7f72',
      shortcut: '\u5feb\u6377\u64cd\u4f5c',
      workflow: '\u5de5\u4f5c\u6d41',
      reference: '\u53c2\u8003',
    },
    'en-US': {
      all: 'All',
      deployment: 'Deployment',
      shortcut: 'Shortcuts',
      workflow: 'Workflow',
      reference: 'Reference',
    },
  };

  return labels[locale][category];
}

function getDocsUploadCopy(locale: 'zh-CN' | 'en-US') {
  if (locale === 'en-US') {
    return {
      category: 'Category',
      date: 'Date',
      failed: 'Save failed. Please confirm the API is deployed and you are signed in.',
      goLogin: 'Log in',
      htmlFile: 'HTML file',
      loginRequired: 'Uploading docs requires login.',
      loginUpload: 'Log in to upload',
      saved: 'Saved',
      saving: 'Saving...',
      submit: 'Submit to API',
      summary: 'Summary',
      tags: 'Tags, comma separated',
      text: 'Text content',
      textPlaceholder: 'Without an HTML file, the backend will generate a standalone HTML page from this text.',
      title: 'Title',
      upload: 'Upload doc',
    };
  }

  return {
    category: '\u5206\u7c7b',
    date: '\u65f6\u95f4',
    failed: '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u63a5\u53e3\u5df2\u7ecf\u90e8\u7f72\u5e76\u4e14\u5f53\u524d\u8d26\u53f7\u5df2\u767b\u5f55\u3002',
    goLogin: '\u53bb\u767b\u5f55',
    htmlFile: 'HTML \u6587\u4ef6',
    loginRequired: '\u4e0a\u4f20\u6587\u6863\u9700\u8981\u5148\u767b\u5f55\u3002',
    loginUpload: '\u767b\u5f55\u540e\u4e0a\u4f20',
    saved: '\u5df2\u4fdd\u5b58',
    saving: '\u4fdd\u5b58\u4e2d...',
    submit: '\u63d0\u4ea4\u5230 API',
    summary: '\u6458\u8981',
    tags: '\u6807\u7b7e\uff08\u9017\u53f7\u5206\u9694\uff09',
    text: '\u6587\u672c\u5185\u5bb9',
    textPlaceholder: '\u6ca1\u6709 HTML \u6587\u4ef6\u65f6\uff0c\u540e\u7aef\u4f1a\u628a\u8fd9\u91cc\u7684\u6587\u672c\u751f\u6210\u72ec\u7acb HTML \u9875\u9762\u3002',
    title: '\u6807\u9898',
    upload: '\u4e0a\u4f20\u6587\u6863',
  };
}

function DocInput({
  label,
  onChange,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}
