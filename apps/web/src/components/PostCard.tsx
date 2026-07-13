import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Locale } from '@blog/shared';
import { messages } from '../i18n';
import type { Post } from '../services/blogService';
import { PostMeta } from './PostMeta';

export function PostCard({ locale, post }: { locale: Locale; post: Post }) {
  const t = messages[locale];
  const translated = post.content[locale];

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-line transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link className="aspect-[16/10] overflow-hidden bg-surface-muted" to={`/posts/${post.id}`}>
        <img alt={translated.title} className="h-full w-full object-cover" loading="lazy" src={post.cover} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <PostMeta locale={locale} post={post} />
        <h3 className="mt-3 text-xl font-semibold leading-snug text-foreground">
          <Link className="transition hover:text-primary" to={`/posts/${post.id}`}>
            {translated.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted">{translated.excerpt}</p>
        <Link
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-foreground"
          to={`/posts/${post.id}`}
        >
          {t.readMore}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
