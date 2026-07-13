import { CalendarDays, Clock3 } from 'lucide-react';
import type { Locale } from '@blog/shared';
import { useCategories } from '../context/categories';
import { messages } from '../i18n';
import type { Post } from '../services/blogService';

export function PostMeta({
  locale,
  post,
  showReadingTime = true,
}: {
  locale: Locale;
  post: Post;
  showReadingTime?: boolean;
}) {
  const { getCategoryLabel } = useCategories();
  const t = messages[locale];
  const translated = post.content[locale];
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(`${post.date}T00:00:00`));

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-muted">
      <span className="rounded-md bg-surface-muted px-2 py-1 text-primary">
        {getCategoryLabel(post.categoryId, locale)}
      </span>
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        {date}
      </span>
      {showReadingTime ? (
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {post.readingMinutes} {t.minRead}
        </span>
      ) : null}
      <span>{translated.author}</span>
    </div>
  );
}
