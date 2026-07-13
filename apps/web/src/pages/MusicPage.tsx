import {
  Disc3,
  ExternalLink,
  Headphones,
  Music2,
  Pause,
  Play,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type MutableRefObject } from 'react';
import type { FavoriteMusic } from '@blog/shared';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { musicService } from '../services/musicService';

export function MusicPage() {
  const { locale } = usePreferences();
  const t = messages[locale];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeTrack, setActiveTrack] = useState<FavoriteMusic | null>(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [tracks, setTracks] = useState<FavoriteMusic[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadMusic() {
      try {
        setLoading(true);
        setError('');
        const nextTracks = await musicService.getMusic(submittedQuery);

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
  }, [submittedQuery]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !activeTrack) {
      return;
    }

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
      return;
    }

    audio.pause();
  }, [activeTrack, isPlaying]);

  const playableCount = useMemo(
    () => tracks.filter((track) => Boolean(track.audioUrl)).length,
    [tracks],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(searchInput);
  }

  function playTrack(track: FavoriteMusic) {
    setActiveTrack(track);
    setIsPlaying(true);
  }

  function closePlayer() {
    audioRef.current?.pause();
    setActiveTrack(null);
    setIsPlaying(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-28 pt-5 sm:px-5 lg:px-6">
      <section className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t.nav.music}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
            {t.musicTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">{t.musicIntro}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 shadow-line">
          <span className="block text-3xl font-semibold text-primary">{playableCount}</span>
          <span className="mt-1 block text-sm text-muted">{t.musicPlayable}</span>
        </div>
      </section>

      <form className="flex max-w-xl gap-2" onSubmit={handleSearch}>
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{t.musicSearchLabel}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            aria-label={t.musicSearchLabel}
            className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t.musicSearchPlaceholder}
            value={searchInput}
          />
        </label>
        <button
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
          type="submit"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {t.musicSearchAction}
        </button>
      </form>

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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{track.title}</h2>
                      <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{formatTrackLine(track)}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-surface-muted px-1.5 py-1 text-[11px] font-semibold text-primary">
                      {track.source}
                    </span>
                  </div>

                  {track.audioUrl ? (
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
                    {track.url ? (
                      <a
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-surface-muted px-2 text-xs font-semibold text-primary"
                        href={musicService.resolveUrl(track.url)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {t.openSource}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {activeTrack ? (
        <FloatingPlayer
          audioRef={audioRef}
          isPlaying={isPlaying}
          onClose={closePlayer}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          track={activeTrack}
        />
      ) : null}
    </main>
  );
}

function FloatingPlayer({
  audioRef,
  isPlaying,
  onClose,
  onEnded,
  onPause,
  onPlay,
  track,
}: {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  onClose: () => void;
  onEnded: () => void;
  onPause: () => void;
  onPlay: () => void;
  track: FavoriteMusic;
}) {
  const { locale } = usePreferences();
  const t = messages[locale];
  const audioUrl = musicService.resolveAudioUrl(track);

  return (
    <aside className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-border bg-surface/95 p-3 text-foreground shadow-soft backdrop-blur sm:inset-x-auto sm:right-6 sm:w-[430px]">
      <div className="flex items-center gap-3">
        <div
          className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-muted animate-[spin_8s_linear_infinite]"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        >
          {track.cover ? (
            <img alt={track.title} className="h-full w-full rounded-full object-cover" src={track.cover} />
          ) : (
            <Disc3 className="h-9 w-9 text-primary" aria-hidden="true" />
          )}
          <span className="absolute h-4 w-4 rounded-full border border-border bg-surface" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t.musicNowPlaying}</p>
          <h2 className="mt-1 truncate text-base font-semibold">{track.title}</h2>
          <p className="truncate text-xs text-muted">{formatTrackLine(track)}</p>
        </div>

        <button
          aria-label={t.musicClosePlayer}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted transition hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <audio
        autoPlay
        className="mt-3 h-10 w-full"
        controls
        onEnded={onEnded}
        onPause={onPause}
        onPlay={onPlay}
        ref={audioRef}
        src={audioUrl}
      />
    </aside>
  );
}

function formatTrackLine(track: FavoriteMusic) {
  const album = track.album?.trim().replace(/^\u300a/, '').replace(/\u300b$/, '');
  const albumLabel = album ? `\u300a${album}\u300b` : '';

  return [track.artist, albumLabel].filter(Boolean).join(' \u00b7 ');
}
