import { ArrowUpRight, Mail, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import type { Locale } from '@blog/shared';
import { PostCard } from '../components/PostCard';
import { PostMeta } from '../components/PostMeta';
import { useCategories } from '../context/categories';
import { usePreferences } from '../context/preferences';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import { messages } from '../i18n';
import { blogService, type BlogCategory, type Category, type CategoryFilter, type Post } from '../services/blogService';

export function BlogHomePage() {
  const { locale } = usePreferences();
  const { categories, getCategoryLabel } = useCategories();
  const t = messages[locale];
  const { error, loading, posts } = usePublishedPosts();
  const featuredPost = blogService.getFeaturedPost(posts);
  const latestPosts = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : [];
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');

  const filteredPosts = useFilteredPosts(latestPosts, category, query, locale);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <section className="grid items-end gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {t.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            {t.intro}
          </p>
        </div>

        <Newsletter locale={locale} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        {featuredPost ? (
          <FeaturedPost locale={locale} post={featuredPost} />
        ) : (
          <PostStatusPanel error={error} loading={loading} locale={locale} />
        )}

        <aside className="flex flex-col gap-5">
          <FilterPanel
            category={category}
            locale={locale}
            categories={categories}
            onCategoryChange={setCategory}
            onQueryChange={setQuery}
            query={query}
          />
          <TopicRail categories={categories} locale={locale} posts={posts} />
        </aside>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t.latest}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              {category === 'all' ? t.all : getCategoryLabel(category, locale)}
            </h2>
          </div>
          <p className="hidden text-sm text-muted sm:block">
            {filteredPosts.length} / {latestPosts.length}
          </p>
        </div>

        {loading || error ? (
          <PostStatusPanel error={error} loading={loading} locale={locale} />
        ) : (
          <PostGrid locale={locale} posts={filteredPosts} />
        )}
      </section>
    </main>
  );
}

export function useFilteredPosts(
  posts: Post[],
  category: CategoryFilter,
  query: string,
  locale: Locale,
) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);

    return posts.filter((post) => {
      if (category !== 'all' && post.categoryId !== category) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const translated = post.content[locale];
      const searchable = `${translated.title} ${translated.excerpt} ${translated.author}`.toLocaleLowerCase(
        locale,
      );

      return searchable.includes(normalizedQuery);
    });
  }, [category, locale, posts, query]);
}

export function PostGrid({ locale, posts }: { locale: Locale; posts: Post[] }) {
  const t = messages[locale];

  if (!posts.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
        {t.noResults}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} locale={locale} post={post} />
      ))}
    </div>
  );
}

export function PostStatusPanel({
  error,
  loading,
  locale,
}: {
  error: string;
  loading: boolean;
  locale: Locale;
}) {
  const t = messages[locale];

  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
      {loading ? t.loadingPosts : error ? t.loadPostsError : t.noResults}
    </div>
  );
}

function Newsletter({ locale }: { locale: Locale }) {
  const t = messages[locale];

  return (
    <form className="rounded-lg border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.newsletterTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{t.newsletterBody}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <input
          className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder={t.emailPlaceholder}
          type="email"
        />
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          type="button"
        >
          {t.subscribe}
        </button>
      </div>
    </form>
  );
}

function FeaturedPost({ locale, post }: { locale: Locale; post: Post }) {
  const t = messages[locale];
  const translated = post.content[locale];

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
      <div className="grid h-full lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
        <Link className="relative min-h-[260px] overflow-hidden bg-surface-muted" to={`/posts/${post.id}`}>
          <img
            alt={translated.title}
            className="h-full w-full object-cover"
            loading="eager"
            src={post.cover}
          />
          <span className="absolute left-4 top-4 rounded-md bg-background/92 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
            {t.featured}
          </span>
        </Link>
        <div className="flex flex-col justify-between gap-8 p-5 sm:p-7">
          <div>
            <PostMeta locale={locale} post={post} />
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {translated.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">{translated.excerpt}</p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            to={`/posts/${post.id}`}
          >
            {t.readMore}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FilterPanel({
  category,
  categories,
  locale,
  onCategoryChange,
  onQueryChange,
  query,
}: {
  category: CategoryFilter;
  categories: BlogCategory[];
  locale: Locale;
  onCategoryChange: (category: CategoryFilter) => void;
  onQueryChange: (query: string) => void;
  query: string;
}) {
  const t = messages[locale];

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-line">
      <label className="relative block">
        <span className="sr-only">{t.searchLabel}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          aria-label={t.searchLabel}
          className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.searchPlaceholder}
          value={query}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {[{ id: 'all' as const, label: t.all }, ...categories.map((item) => ({ id: item.id, label: item.name[locale] }))].map((item) => (
          <button
            className={`min-h-10 rounded-lg border px-3 text-sm font-medium transition ${
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
    </div>
  );
}

function TopicRail({
  categories,
  locale,
  posts,
}: {
  categories: BlogCategory[];
  locale: Locale;
  posts: Post[];
}) {
  const { getCategoryLabel } = useCategories();
  const counts = blogService.getCategoryCounts(posts, categories);

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-surface p-4 shadow-line sm:grid-cols-2 lg:grid-cols-1">
      {counts.map((item: { id: Category; count: number }) => (
        <div
          className="flex items-center justify-between rounded-lg bg-background px-3 py-3"
          key={item.id}
        >
          <span className="text-sm font-medium text-foreground">{getCategoryLabel(item.id, locale)}</span>
          <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-semibold text-muted">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
