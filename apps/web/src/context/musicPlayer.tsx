import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FavoriteMusic } from '@blog/shared';
import { MusicFloatingPlayer } from '../components/MusicFloatingPlayer';

type MusicPlayerContextValue = {
  activeTrack: FavoriteMusic | null;
  closePlayer: () => void;
  isPlaying: boolean;
  playTrack: (track: FavoriteMusic) => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeTrack, setActiveTrack] = useState<FavoriteMusic | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !activeTrack || !activeTrack.audioUrl) {
      audio?.pause();
      return;
    }

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
      return;
    }

    audio.pause();
  }, [activeTrack, isPlaying]);

  function playTrack(track: FavoriteMusic) {
    setActiveTrack(track);
    setIsPlaying(true);
  }

  function closePlayer() {
    audioRef.current?.pause();
    setActiveTrack(null);
    setIsPlaying(false);
  }

  const value = useMemo(
    () => ({
      activeTrack,
      closePlayer,
      isPlaying,
      playTrack,
    }),
    [activeTrack, isPlaying],
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {activeTrack ? (
        <MusicFloatingPlayer
          audioRef={audioRef}
          isPlaying={isPlaying}
          onClose={closePlayer}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          track={activeTrack}
        />
      ) : null}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);

  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }

  return context;
}
