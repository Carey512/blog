import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CalendarClock,
  FileText,
  Globe2,
  Music2,
  Newspaper,
  Pause,
  Play,
  QrCode,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { FavoriteMusic, Locale, WorkDoc } from '@blog/shared';
import { formatTrackLine } from '../components/MusicFloatingPlayer';
import { useMusicPlayer } from '../context/musicPlayer';
import { usePreferences } from '../context/preferences';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import { messages } from '../i18n';
import {
  blogService,
  type CategoryFilter,
  type Post,
} from '../services/blogService';
import { docsService } from '../services/docsService';
import { musicService } from '../services/musicService';

export function BlogHomePage() {
  const { locale } = usePreferences();
  const { activeTrack, isPlaying, playTrack } = useMusicPlayer();
  const t = messages[locale];
  const {
    error: postsError,
    loading: postsLoading,
    posts,
  } = usePublishedPosts();
  const [docs, setDocs] = useState<WorkDoc[]>([]);
  const [docsError, setDocsError] = useState('');
  const [docsLoading, setDocsLoading] = useState(true);
  const [musicError, setMusicError] = useState('');
  const [musicLoading, setMusicLoading] = useState(true);
  const [tracks, setTracks] = useState<FavoriteMusic[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadHomeData() {
      try {
        setMusicLoading(true);
        setMusicError('');
        const nextTracks = await musicService.getMusic();

        if (alive) {
          setTracks(nextTracks);
        }
      } catch {
        if (alive) {
          setTracks([]);
          setMusicError('failed');
        }
      } finally {
        if (alive) {
          setMusicLoading(false);
        }
      }

      try {
        setDocsLoading(true);
        setDocsError('');
        const nextDocs = await docsService.getDocs();

        if (alive) {
          setDocs(nextDocs);
        }
      } catch {
        if (alive) {
          setDocs([]);
          setDocsError('failed');
        }
      } finally {
        if (alive) {
          setDocsLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-3 pb-28 pt-5 sm:px-5 lg:px-6">
      <section className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t.eyebrow}
        </p>
        <h1 className="mt-1 max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {t.headline}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t.intro}</p>
      </section>

      <HomeModule
        eyebrow={locale === 'zh-CN' ? '内容模块' : 'Content modules'}
        Icon={Newspaper}
        moreLabel={locale === 'zh-CN' ? '更多文章' : 'More articles'}
        title={t.nav.articles}
        to="/articles"
      >
        {postsLoading || postsError ? (
          <ModuleStatus
            error={postsError}
            loading={postsLoading}
            text={postsError ? t.loadPostsError : t.loadingPosts}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {posts.slice(0, 4).map(post => (
              <HomeArticleCard key={post.id} locale={locale} post={post} />
            ))}
          </div>
        )}
      </HomeModule>

      <HomeModule
        eyebrow={locale === 'zh-CN' ? '个人收藏' : 'Personal library'}
        Icon={Music2}
        moreLabel={locale === 'zh-CN' ? '更多音乐' : 'More music'}
        title={t.nav.music}
        to="/music"
      >
        {musicLoading || musicError ? (
          <ModuleStatus
            error={musicError}
            loading={musicLoading}
            text={musicError ? t.loadMusicError : t.loadingMusic}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {tracks.slice(0, 4).map(track => (
              <HomeMusicCard
                active={activeTrack?.id === track.id}
                isPlaying={isPlaying}
                key={track.id}
                locale={locale}
                onPlay={() => playTrack(track)}
                track={track}
              />
            ))}
          </div>
        )}
      </HomeModule>

      <HomeModule
        eyebrow={locale === 'zh-CN' ? '工作沉淀' : 'Work notes'}
        Icon={BookOpenText}
        moreLabel={locale === 'zh-CN' ? '更多文档' : 'More docs'}
        title={t.nav.docs}
        to="/docs"
      >
        {docsLoading || docsError ? (
          <ModuleStatus
            error={docsError}
            loading={docsLoading}
            text={docsError ? t.docsLoadError : t.docsLoading}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {docs.slice(0, 4).map(doc => (
              <HomeDocCard key={doc.id} doc={doc} locale={locale} />
            ))}
          </div>
        )}
      </HomeModule>

      <HomeModule
        eyebrow={locale === 'zh-CN' ? '效率工具' : 'Utilities'}
        Icon={Wrench}
        moreLabel={locale === 'zh-CN' ? '更多工具' : 'More tools'}
        title={t.nav.tools}
        to="/tools"
      >
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <HomeToolCard
            Icon={CalendarClock}
            intro={t.timestampToolIntro}
            locale={locale}
            title={t.timestampToolTitle}
            to="/tools/timestamp"
            tone="primary"
          />
          <HomeToolCard
            Icon={Globe2}
            intro={t.ipToolIntro}
            locale={locale}
            title={t.ipToolTitle}
            to="/tools/ip-lookup"
            tone="accent"
          />
          <HomeToolCard
            Icon={QrCode}
            intro={t.qrToolIntro}
            locale={locale}
            title={t.qrToolTitle}
            to="/tools/qr-code"
            tone="primary"
          />
        </div>
      </HomeModule>

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

    return posts.filter(post => {
      if (category !== 'all' && post.categoryId !== category) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const translated = post.content[locale];
      const searchable =
        `${translated.title} ${translated.excerpt} ${translated.author}`.toLocaleLowerCase(
          locale,
        );

      return searchable.includes(normalizedQuery);
    });
  }, [category, locale, posts, query]);
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

function HomeModule({
  children,
  eyebrow,
  Icon,
  moreLabel,
  title,
  to,
}: {
  children: React.ReactNode;
  eyebrow: string;
  Icon: typeof Newspaper;
  moreLabel: string;
  title: string;
  to: string;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h2 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
              {title}
            </h2>
          </div>
        </div>
        <Link
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-muted transition hover:text-foreground"
          to={to}
        >
          {moreLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>
      {children}
    </section>
  );
}

function HomeArticleCard({ locale, post }: { locale: Locale; post: Post }) {
  const translated = post.content[locale];

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-line transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link
        className="block aspect-[2/1] overflow-hidden bg-surface-muted"
        to={`/posts/${post.id}`}
      >
        {post.cover ? (
          <img
            alt={translated.title}
            className="h-full w-full object-cover"
            loading="lazy"
            src={post.cover}
          />
        ) : (
          <div className="grid h-full place-items-center px-3 text-center text-xs font-semibold leading-5 text-muted">
            {translated.title}
          </div>
        )}
      </Link>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-primary">
          {translated.author}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
          {translated.title}
        </h3>
        <Link
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          to={`/posts/${post.id}`}
        >
          Read
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function HomeMusicCard({
  active,
  isPlaying,
  locale,
  onPlay,
  track,
}: {
  active: boolean;
  isPlaying: boolean;
  locale: Locale;
  onPlay: () => void;
  track: FavoriteMusic;
}) {
  const t = messages[locale];

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-line">
      <div className="aspect-[2/1] bg-surface-muted">
        {track.cover ? (
          <img
            alt={track.title}
            className="h-full w-full object-cover"
            loading="lazy"
            src={track.cover}
          />
        ) : (
          <div className="grid h-full place-items-center text-primary">
            <Music2 className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {track.title}
        </h3>
        <p className="mt-1 truncate text-xs text-muted">
          {formatTrackLine(track)}
        </p>
        {musicService.isPlayable(track) ? (
          <button
            className={`mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
            onClick={onPlay}
            type="button"
          >
            {active && isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {active && isPlaying ? t.musicNowPlaying : t.playMusic}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function HomeDocCard({ doc, locale }: { doc: WorkDoc; locale: Locale }) {
  const translated = doc.content[locale] ?? doc.content['zh-CN'];

  return (
    <article className="rounded-lg border border-border bg-surface p-3 shadow-line transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link
        className="flex min-h-32 flex-col justify-between"
        to={`/docs/${doc.id}`}
      >
        <div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
            {translated.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
            {translated.summary}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
          <span>{doc.updatedAt}</span>
          <span className="rounded-md bg-surface-muted px-2 py-1">
            {doc.category}
          </span>
        </div>
      </Link>
    </article>
  );
}

function HomeToolCard({
  Icon,
  intro,
  locale,
  title,
  to,
  tone,
}: {
  Icon: typeof CalendarClock;
  intro: string;
  locale: Locale;
  title: string;
  to: string;
  tone: 'accent' | 'primary';
}) {
  const iconClassName =
    tone === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground';

  return (
    <article className="rounded-lg border border-border bg-surface p-3 shadow-line transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link className="flex min-h-32 flex-col justify-between" to={to}>
        <div>
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
            {intro}
          </p>
        </div>
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          {locale === 'zh-CN' ? '打开工具' : 'Open tool'}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </Link>
    </article>
  );
}

function ModuleStatus({
  error,
  loading,
  text,
}: {
  error: string;
  loading: boolean;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted">
      {loading || error ? text : 'No data'}
    </div>
  );
}
