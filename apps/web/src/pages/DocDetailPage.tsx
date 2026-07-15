import { ArrowLeft, BookOpenText, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { WorkDoc } from '@blog/shared';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { docsService } from '../services/docsService';
import { getDocCategoryLabel } from './DocsPage';

export function DocDetailPage() {
  const { locale } = usePreferences();
  const t = messages[locale];
  const { docId } = useParams();
  const [doc, setDoc] = useState<WorkDoc | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDoc() {
      if (!docId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const nextDoc = await docsService.getDocById(docId);

        if (alive) {
          setDoc(nextDoc);
        }
      } catch {
        if (alive) {
          setDoc(null);
          setError('failed');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadDoc();

    return () => {
      alive = false;
    };
  }, [docId]);

  if (loading || !doc) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
          {loading ? t.docsLoading : error ? t.docsLoadError : t.notFoundBody}
        </section>
      </main>
    );
  }

  const translated = doc.content[locale];
  const sections = translated.sections ?? [];
  const docHtmlUrl = doc.htmlFile ? docsService.getDocHtmlUrl(doc.htmlFile) : '';

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/docs">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.docsBackToList}
      </Link>

      <article className="mt-5 overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <header className="border-b border-border p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-2 rounded-md bg-surface-muted px-2 py-1 font-semibold">
              <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
              {getDocCategoryLabel(doc.category, locale)}
            </span>
            <span>{doc.updatedAt}</span>
            {doc.tags.map((tag) => (
              <span className="rounded-md bg-surface-muted px-2 py-1" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {translated.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{translated.summary}</p>
        </header>

        <div className="p-3 sm:p-4">
          {docHtmlUrl ? (
            <section className="overflow-hidden rounded-lg border border-border bg-background shadow-line">
              <div className="flex flex-col gap-2 border-b border-border bg-surface-muted px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-foreground">{doc.htmlFile}</span>
                <a
                  className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                  href={docHtmlUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {locale === 'zh-CN' ? '打开独立 HTML' : 'Open standalone HTML'}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
              <iframe
                className="h-[78vh] min-h-[720px] w-full bg-white"
                src={docHtmlUrl}
                title={translated.title}
              />
            </section>
          ) : (
            <>
              <div
                className={`space-y-4 text-base leading-8 text-foreground ${
                  sections.length ? 'rounded-lg border border-border bg-surface-muted p-4' : ''
                }`}
              >
                {translated.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {sections.length ? (
                <section className="mt-5 grid gap-3 lg:grid-cols-2">
                  {sections.map((section, index) => (
                    <article
                      className="rounded-lg border border-border bg-background p-4 shadow-line"
                      key={section.title}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-semibold leading-6 text-foreground">{section.title}</h2>
                          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                            {section.items.map((item) => (
                              <li className="flex gap-2" key={item}>
                                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      </article>
    </main>
  );
}
