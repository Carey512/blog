import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Search, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CreatePostBody, Locale, PostCategoryId } from '@blog/shared';
import { ModulePageHeader } from '../components/ModulePageHeader';
import { PostStatusPanel, useFilteredPosts } from './BlogHomePage';
import { PostMeta } from '../components/PostMeta';
import { UploadDialog } from '../components/UploadDialog';
import { useAuth } from '../context/auth';
import { useCategories } from '../context/categories';
import { usePreferences } from '../context/preferences';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import { messages } from '../i18n';
import { blogService, type BlogCategory, type CategoryFilter, type Post } from '../services/blogService';

export function ArticlesPage() {
  const { isAuthenticated, token, user } = useAuth();
  const { locale } = usePreferences();
  const { categories } = useCategories();
  const t = messages[locale];
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [cover, setCover] = useState('');
  const [excerptEn, setExcerptEn] = useState('A short idea submitted from the public website.');
  const [excerptZh, setExcerptZh] = useState('这是一篇从前台提交的短文章，等待后台审核后发布。');
  const [message, setMessage] = useState('');
  const [postCategoryId, setPostCategoryId] = useState<PostCategoryId>('notes');
  const [query, setQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [titleEn, setTitleEn] = useState('A submitted article');
  const [titleZh, setTitleZh] = useState('前台上传文章');
  const { error, loading, posts } = usePublishedPosts();
  const filteredPosts = useFilteredPosts(posts, category, query, locale);

  async function handleCreateArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    const body: CreatePostBody = {
      categoryId: postCategoryId,
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
      setMessage(`${t.articleSubmitSuccessPrefix}${created.content[locale].title}`);
      setShowUpload(false);
    } catch {
      setMessage(t.articleSubmitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-8 pt-4 sm:px-5 lg:px-6">
      <ModulePageHeader
        count={posts.length}
        countLabel={t.articleCount}
        eyebrow={t.nav.articles}
        intro={t.allArticlesIntro}
        title={t.allArticlesTitle}
      />

      <section className="space-y-4">
        <ArticleFilterBar
          category={category}
          categories={categories}
          isAuthenticated={isAuthenticated}
          locale={locale}
          onCategoryChange={setCategory}
          onQueryChange={setQuery}
          onUploadClick={() => setShowUpload(true)}
          query={query}
        />
        {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}
        {loading || error ? (
          <PostStatusPanel error={error} loading={loading} locale={locale} />
        ) : (
          <ArticleGrid locale={locale} posts={filteredPosts} />
        )}
      </section>

      <UploadDialog onClose={() => setShowUpload(false)} open={showUpload} title={t.articleUploadTitle}>
        {isAuthenticated ? (
          <form className="grid gap-3" onSubmit={handleCreateArticle}>
            <div className="grid gap-3 sm:grid-cols-2">
              <ArticleModalField label={t.articleTitleZhLabel} onChange={setTitleZh} value={titleZh} />
              <ArticleModalField label={t.articleTitleEnLabel} onChange={setTitleEn} value={titleEn} />
              <ArticleModalField label={t.articleCoverLabel} onChange={setCover} value={cover} />
              <label className="block text-sm font-medium text-foreground">
                {t.articleCategoryLabel}
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setPostCategoryId(event.target.value as PostCategoryId)}
                  value={postCategoryId}
                >
                  {categories.length ? (
                    categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name[locale]}
                      </option>
                    ))
                  ) : (
                    <option value={postCategoryId}>{t.categories[postCategoryId]}</option>
                  )}
                </select>
              </label>
            </div>
            <ArticleModalTextarea label={t.articleBodyZhLabel} onChange={setExcerptZh} value={excerptZh} />
            <ArticleModalTextarea label={t.articleBodyEnLabel} onChange={setExcerptEn} value={excerptEn} />
            <div className="rounded-lg bg-surface-muted p-3 text-sm leading-6 text-muted">
              {t.articleUploadHint}
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {submitting ? t.articleSubmitting : t.articleSubmitReview}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted">{t.articleUploadLoginRequired}</p>
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              to="/login?redirect=/articles"
            >
              {t.goLogin}
            </Link>
          </div>
        )}
      </UploadDialog>
    </main>
  );
}

function ArticleFilterBar({
  category,
  categories,
  isAuthenticated,
  locale,
  onCategoryChange,
  onQueryChange,
  onUploadClick,
  query,
}: {
  category: CategoryFilter;
  categories: BlogCategory[];
  isAuthenticated: boolean;
  locale: Locale;
  onCategoryChange: (category: CategoryFilter) => void;
  onQueryChange: (query: string) => void;
  onUploadClick: () => void;
  query: string;
}) {
  const t = messages[locale];

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface p-2 shadow-line">
      <label className="relative min-w-[11rem] max-w-[22rem] flex-[0_0_46%] sm:flex-[0_0_20rem] lg:flex-[0_0_22rem]">
        <span className="sr-only">{t.searchLabel}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          aria-label={t.searchLabel}
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.searchPlaceholder}
          value={query}
        />
      </label>

      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
        {[{ id: 'all' as const, label: t.all }, ...categories.map((item) => ({ id: item.id, label: item.name[locale] }))].map((item) => (
          <button
            className={`min-h-10 shrink-0 rounded-lg border px-3 text-sm font-medium transition ${
              category === item.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted hover:text-foreground'
            }`}
            key={item.id}
            onClick={() => onCategoryChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        onClick={onUploadClick}
        type="button"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {isAuthenticated ? t.articleUploadAction : t.articleLoginUploadAction}
      </button>
    </div>
  );
}

function ArticleGrid({ locale, posts }: { locale: Locale; posts: Post[] }) {
  const t = messages[locale];

  if (!posts.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
        {t.noResults}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {posts.map((post) => (
        <ArticleIndexCard key={post.id} locale={locale} post={post} />
      ))}
    </div>
  );
}

function ArticleIndexCard({ locale, post }: { locale: Locale; post: Post }) {
  const t = messages[locale];
  const translated = post.content[locale];

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-line transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link className="aspect-[2/1] overflow-hidden bg-surface-muted" to={`/posts/${post.id}`}>
        <img alt={translated.title} className="h-full w-full object-cover" loading="lazy" src={post.cover} />
      </Link>
      <div className="flex flex-1 flex-col p-2.5">
        <PostMeta locale={locale} post={post} showReadingTime={false} />
        <h2 className="mt-2 flex-1 text-sm font-semibold leading-snug text-foreground sm:text-base">
          <Link className="transition hover:text-primary" to={`/posts/${post.id}`}>
            {translated.title}
          </Link>
        </h2>
        <Link
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-foreground sm:text-sm"
          to={`/posts/${post.id}`}
        >
          {t.readMore}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function ArticleModalField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ArticleModalTextarea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <textarea
        className="mt-1 min-h-28 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
