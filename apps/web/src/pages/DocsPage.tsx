import { BookOpenText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { WorkDoc, WorkDocCategory } from '@blog/shared';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { docsService } from '../services/docsService';

const docCategories: Array<WorkDocCategory | 'all'> = ['all', 'deployment', 'shortcut', 'workflow', 'reference'];

export function DocsPage() {
  const { locale } = usePreferences();
  const t = messages[locale];
  const [category, setCategory] = useState<WorkDocCategory | 'all'>('all');
  const [docs, setDocs] = useState<WorkDoc[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) => {
        const text = [
          doc.category,
          ...doc.tags,
          doc.content[locale].title,
          doc.content[locale].summary,
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <section className="border-b border-border pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{t.nav.docs}</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-foreground">{t.docsTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{t.docsIntro}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
            <span className="block text-2xl font-semibold text-primary">{docs.length}</span>
            {t.docsCount}
          </div>
        </div>
      </section>

      <section className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t.docsSearchLabel}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.docsSearchPlaceholder}
            value={query}
          />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {docCategories.map((item) => (
            <button
              className={`h-10 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition ${
                category === item
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-surface text-muted hover:text-foreground'
              }`}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {getDocCategoryLabel(item, locale)}
            </button>
          ))}
        </div>
      </section>

      {loading || error ? (
        <section className="mt-5 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
          {loading ? t.docsLoading : t.docsLoadError}
        </section>
      ) : (
        <section className="mt-5 grid gap-3 lg:grid-cols-2">
          {filteredDocs.length ? (
            filteredDocs.map((doc) => {
              const translated = doc.content[locale];

              return (
                <article className="rounded-lg border border-border bg-surface p-4 shadow-line" key={doc.id}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <BookOpenText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="rounded-md bg-surface-muted px-2 py-1 font-semibold">
                          {getDocCategoryLabel(doc.category, locale)}
                        </span>
                        <span>{doc.updatedAt}</span>
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-foreground">
                        <Link className="transition hover:text-primary" to={`/docs/${doc.id}`}>
                          {translated.title}
                        </Link>
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{translated.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {doc.tags.map((tag) => (
                          <span className="rounded-md bg-surface-muted px-2 py-1 text-xs text-muted" key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted lg:col-span-2">
              {t.docsNoResults}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export function getDocCategoryLabel(category: WorkDocCategory | 'all', locale: 'zh-CN' | 'en-US') {
  const labels = {
    'zh-CN': {
      all: '全部',
      deployment: '部署',
      shortcut: '快捷操作',
      workflow: '工作流',
      reference: '参考',
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
