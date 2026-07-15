import { Disc3, X } from 'lucide-react';
import type { FavoriteMusic } from '@blog/shared';
import type { MutableRefObject } from 'react';
import { usePreferences } from '../context/preferences';
import { messages } from '../i18n';
import { musicService } from '../services/musicService';

export function MusicFloatingPlayer({
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

export function formatTrackLine(track: FavoriteMusic) {
  const album = track.album?.trim().replace(/^\u300a/, '').replace(/\u300b$/, '');
  const albumLabel = album ? `\u300a${album}\u300b` : '';

  return [track.artist, albumLabel].filter(Boolean).join(' \u00b7 ');
}
