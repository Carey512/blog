import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PostMeta } from '../components/PostMeta';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { blogService, type Post } from '../services/blogService';

export function PostDetailPage() {
  const { locale } = usePreferences();
  const t = messages[locale];
  const { postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadPost() {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const nextPost = await blogService.getPostById(postId);

        if (alive) {
          setPost(nextPost.status === 'published' ? nextPost : null);
        }
      } catch {
        if (alive) {
          setError('failed');
          setPost(null);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      alive = false;
    };
  }, [postId]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-surface p-8 text-muted shadow-line">
          {t.loadingPosts}
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-surface p-8 shadow-line">
          <h1 className="text-3xl font-semibold text-foreground">{t.notFoundTitle}</h1>
          <p className="mt-3 text-muted">{error ? t.loadPostsError : t.notFoundBody}</p>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t.backHome}
          </Link>
        </div>
      </main>
    );
  }

  const translated = post.content[locale];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/articles">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.nav.articles}
      </Link>

      <article className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <div className="aspect-[16/8] bg-surface-muted">
          <img alt={translated.title} className="h-full w-full object-cover" src={post.cover} />
        </div>
        <div className="p-5 sm:p-8">
          <PostMeta locale={locale} post={post} />
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {translated.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">{translated.excerpt}</p>
          <div className="mt-8 space-y-5 border-t border-border pt-8 text-base leading-8 text-foreground">
            {translated.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
