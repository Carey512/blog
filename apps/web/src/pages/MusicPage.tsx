import {
  Headphones,
  Music2,
  Pause,
  Play,
  Search,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { FavoriteMusic, Locale, MusicCategory, MusicCategoryId } from '@blog/shared';
import { ModulePageHeader } from '../components/ModulePageHeader';
import { formatTrackLine } from '../components/MusicFloatingPlayer';
import { UploadDialog } from '../components/UploadDialog';
import { useAuth } from '../context/auth';
import { useMusicPlayer } from '../context/musicPlayer';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { musicService } from '../services/musicService';

export function MusicPage() {
  const { isAuthenticated, token } = useAuth();
  const { activeTrack, isPlaying, playTrack } = useMusicPlayer();
  const { locale } = usePreferences();
  const t = messages[locale];
  const [album, setAlbum] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState<MusicCategoryId | 'all'>('all');
  const [cover, setCover] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [musicCategories, setMusicCategories] = useState<MusicCategory[]>([]);
  const [musicCategoryId, setMusicCategoryId] = useState<MusicCategoryId>('mandarin');
  const [searchInput, setSearchInput] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [tracks, setTracks] = useState<FavoriteMusic[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadMusic() {
      try {
        setLoading(true);
        setError('');
        const nextTracks = await musicService.getMusic({ category, query: submittedQuery });

        if (alive) {
          setTracks(nextTracks);
        }
      } catch {
        if (alive) {
          setError('failed');
          setTracks([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadMusic();

    return () => {
      alive = false;
    };
  }, [category, submittedQuery]);

  useEffect(() => {
    let alive = true;

    async function loadMusicCategories() {
      try {
        const nextCategories = await musicService.getMusicCategories();

        if (alive) {
          setMusicCategories(nextCategories);
        }
      } catch {
        if (alive) {
          setMusicCategories([]);
        }
      }
    }

    void loadMusicCategories();

    return () => {
      alive = false;
    };
  }, []);

  const playableCount = useMemo(
    () => tracks.filter((track) => musicService.isPlayable(track)).length,
    [tracks],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(searchInput);
  }

  async function handleUploadMusic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    if (!file) {
      setMessage("\u8bf7\u5148\u9009\u62e9\u97f3\u9891\u6587\u4ef6\u3002");
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('categoryId', musicCategoryId);
      formData.append('album', album);
      formData.append('cover', cover);
      formData.append('file', file);
      const created = await musicService.uploadMusic(formData, token);

      setTracks((currentTracks) => [created, ...currentTracks]);
      setMessage(`\u5df2\u4fdd\u5b58\u97f3\u4e50\uff1a${created.title}`);
      setAlbum('');
      setArtist('');
      setCover('');
      setFile(null);
      setTitle('');
      setShowUpload(false);
    } catch {
      setMessage("\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u5df2\u767b\u5f55\u3001\u63a5\u53e3\u5df2\u90e8\u7f72\uff0c\u5e76\u9009\u62e9\u97f3\u9891\u6587\u4ef6\u3002");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-28 pt-4 sm:px-5 lg:px-6">
      <ModulePageHeader
        count={playableCount}
        countLabel={t.musicPlayable}
        eyebrow={t.nav.music}
        intro={t.musicIntro}
        title={t.musicTitle}
      />

      <section className="space-y-4">
        <MusicFilterBar
          category={category}
          categories={musicCategories}
          isAuthenticated={isAuthenticated}
          locale={locale}
          onCategoryChange={setCategory}
          onSearch={handleSearch}
          onSearchInputChange={setSearchInput}
          onUploadClick={() => setShowUpload(true)}
          searchInput={searchInput}
        />
      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}

      {loading || error || !tracks.length ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
          {loading ? t.loadingMusic : error ? t.loadMusicError : t.noMusicResults}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {tracks.map((track) => {
            const active = activeTrack?.id === track.id;

            return (
              <article
                className="overflow-hidden rounded-lg border border-border bg-surface shadow-line"
                key={track.id}
              >
                <div className="aspect-[2/1] bg-surface-muted">
                  {track.cover ? (
                    <img alt={track.title} className="h-full w-full object-cover" src={track.cover} />
                  ) : (
                    <div className="grid h-full place-items-center text-primary">
                      <Music2 className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{track.title}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{formatTrackLine(track)}</p>
                  </div>

                  {musicService.isPlayable(track) ? (
                    <button
                      className={`mt-2.5 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition ${
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-primary text-primary-foreground hover:opacity-90'
                      }`}
                      onClick={() => playTrack(track)}
                      type="button"
                    >
                      {active && isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {active && isPlaying ? t.musicNowPlaying : t.playMusic}
                    </button>
                  ) : (
                    <p className="mt-2.5 rounded-lg bg-surface-muted px-2 py-1.5 text-xs leading-5 text-muted">
                      {t.musicNoAudio}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-background px-2 text-xs text-muted">
                      <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                      {track.platform ?? 'Music'}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      </section>


      <UploadDialog onClose={() => setShowUpload(false)} open={showUpload} title="涓婁紶闊充箰">
        {isAuthenticated ? (
          <form className="grid gap-3" onSubmit={handleUploadMusic}>
            <div className="grid gap-3 sm:grid-cols-2">
              <MusicModalField label="姝屾洸鏍囬" onChange={setTitle} required value={title} />
              <MusicModalField label="姝屾墜" onChange={setArtist} required value={artist} />
              <label className="block text-sm font-medium text-foreground">
                {locale === 'zh-CN' ? '\u5206\u7c7b' : 'Category'}
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setMusicCategoryId(event.target.value as MusicCategoryId)}
                  value={musicCategoryId}
                >
                  {musicCategories.length ? (
                    musicCategories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name[locale]}
                      </option>
                    ))
                  ) : (
                    <option value={musicCategoryId}>
                      {getMusicCategoryLabel(musicCategoryId, musicCategories, locale)}
                    </option>
                  )}
                </select>
              </label>
              <MusicModalField label="涓撹緫" onChange={setAlbum} value={album} />
              <MusicModalField label="灏侀潰 URL" onChange={setCover} value={cover} />
              <label className="block text-sm font-medium text-foreground">
                鏈湴闊抽鏂囦欢
                <input
                  accept="audio/*"
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            </div>
            <div className="rounded-lg bg-surface-muted p-3 text-sm leading-6 text-muted">
              璇烽€夋嫨闊抽鏂囦欢涓婁紶锛屼繚瀛樺悗浼氬湪闊充箰鍒楄〃涓挱鏀俱€?
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {submitting ? '\u4fdd\u5b58\u4e2d...' : '\u4fdd\u5b58\u97f3\u4e50'}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
            <p className="text-sm text-muted">
              {'\u4e0a\u4f20\u97f3\u4e50\u9700\u8981\u5148\u767b\u5f55\u3002'}
            </p>
            <a
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              href="/login?redirect=/music"
            >
              {'\u53bb\u767b\u5f55'}
            </a>
          </div>
        )}
      </UploadDialog>
    </main>
  );
}

function MusicFilterBar({
  category,
  categories,
  isAuthenticated,
  locale,
  onCategoryChange,
  onSearch,
  onSearchInputChange,
  onUploadClick,
  searchInput,
}: {
  category: MusicCategoryId | 'all';
  categories: MusicCategory[];
  isAuthenticated: boolean;
  locale: Locale;
  onCategoryChange: (category: MusicCategoryId | 'all') => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSearchInputChange: (value: string) => void;
  onUploadClick: () => void;
  searchInput: string;
}) {
  const t = messages[locale];
  const categoryItems: Array<{ id: MusicCategoryId | 'all'; label: string }> = [
    { id: 'all', label: t.all },
    ...categories.map((item) => ({ id: item.id, label: item.name[locale] })),
  ];

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface p-2 shadow-line">
      <form
        className="flex min-w-[13rem] max-w-[30rem] flex-[0_0_52%] gap-2 sm:flex-[0_0_27rem]"
        onSubmit={onSearch}
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t.musicSearchLabel}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            aria-label={t.musicSearchLabel}
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder={t.musicSearchPlaceholder}
            value={searchInput}
          />
        </label>
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          type="submit"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {t.musicSearchAction}
        </button>
      </form>

      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
        {categoryItems.map((item) => (
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
        {isAuthenticated
          ? locale === 'zh-CN'
            ? '\u4e0a\u4f20\u97f3\u4e50'
            : 'Upload music'
          : locale === 'zh-CN'
            ? '\u767b\u5f55\u4e0a\u4f20'
            : 'Log in to upload'}
      </button>
    </div>
  );
}

function getMusicCategoryLabel(
  categoryId: MusicCategoryId,
  categories: MusicCategory[],
  locale: Locale,
) {
  const category = categories.find((item) => item.id === categoryId);

  if (category) {
    return category.name[locale];
  }

  const fallback: Record<Locale, Record<MusicCategoryId, string>> = {
    'zh-CN': {
      instrumental: '\u7eaf\u97f3\u4e50',
      live: '\u73b0\u573a',
      mandarin: '\u4e2d\u6587',
      personal: '\u79c1\u85cf',
    },
    'en-US': {
      instrumental: 'Instrumental',
      live: 'Live',
      mandarin: 'Chinese',
      personal: 'Personal',
    },
  };

  return fallback[locale][categoryId];
}

function MusicModalField({
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
