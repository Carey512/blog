import { FilePenLine, LockKeyhole } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CreatePostBody, PostCategoryId } from '@blog/shared';
import { useAuth } from '../context/auth';
import { useCategories } from '../context/categories';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { blogService } from '../services/blogService';

export function SubmitPage() {
  const { isAuthenticated, token, user } = useAuth();
  const { categories } = useCategories();
  const { locale } = usePreferences();
  const t = messages[locale];
  const [categoryId, setCategoryId] = useState<PostCategoryId>('notes');
  const [cover, setCover] = useState('');
  const [excerptEn, setExcerptEn] = useState('A short idea submitted from the public website.');
  const [excerptZh, setExcerptZh] = useState('这是一篇从前台提交的短文章，等待后台审核后发布。');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [titleEn, setTitleEn] = useState('A submitted article');
  const [titleZh, setTitleZh] = useState('前台投稿文章');

  useEffect(() => {
    if (categories.length && !categories.some((category) => category.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    const body: CreatePostBody = {
      categoryId,
      content: {
        'zh-CN': {
          author: user?.name ?? 'Author',
          body: [excerptZh],
          excerpt: excerptZh,
          title: titleZh,
        },
        'en-US': {
          author: user?.name ?? 'Author',
          body: [excerptEn],
          excerpt: excerptEn,
          title: titleEn,
        },
      },
      cover: cover || undefined,
      readingMinutes: 4,
      status: 'review',
    };

    try {
      const created = await blogService.createPost(body, token);
      setMessage(`${t.submitSuccess}: ${created.content[locale].title}`);
    } catch {
      setMessage(t.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto grid w-full max-w-4xl flex-1 place-items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl rounded-lg border border-border bg-surface p-6 shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-accent-foreground">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-foreground">{t.submitLoginRequiredTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{t.submitLoginRequiredBody}</p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
            to="/login?redirect=/submit"
          >
            {t.goLogin}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <section className="border-b border-border pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t.protectedAction}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          {t.submitTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{t.submitIntro}</p>
      </section>

      <form className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
        <section className="rounded-lg border border-border bg-surface p-5 shadow-line">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FilePenLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t.submitFormTitle}</h2>
              <p className="text-sm text-muted">{t.submitFormBody}</p>
            </div>
          </div>

          <TextField label={t.submitTitleZh} onChange={setTitleZh} value={titleZh} />
          <TextAreaField label={t.submitExcerptZh} onChange={setExcerptZh} value={excerptZh} />
          <TextField label={t.submitTitleEn} onChange={setTitleEn} value={titleEn} />
          <TextAreaField label={t.submitExcerptEn} onChange={setExcerptEn} value={excerptEn} />
          <TextField label={t.submitCover} onChange={setCover} value={cover} />
        </section>

        <aside className="rounded-lg border border-border bg-surface p-5 shadow-line">
          <label className="block text-sm font-medium text-foreground">
            {t.submitCategory}
            <select
              className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setCategoryId(event.target.value as PostCategoryId)}
              value={categoryId}
            >
              {categories.length ? (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name[locale]}
                  </option>
                ))
              ) : (
                <option value={categoryId}>{t.categories[categoryId]}</option>
              )}
            </select>
          </label>

          <div className="mt-5 rounded-lg bg-surface-muted p-4 text-sm leading-6 text-muted">
            {t.submitReviewHint}
          </div>

          {message ? <p className="mt-4 text-sm font-medium text-primary">{message}</p> : null}

          <button
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? t.submitLoading : t.submitAction}
          </button>
        </aside>
      </form>
    </main>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="mt-5 block text-sm font-medium text-foreground">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="mt-5 block text-sm font-medium text-foreground">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
