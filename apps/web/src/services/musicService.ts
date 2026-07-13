import type { FavoriteMusic } from '@blog/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

function toApiUrl(path: string) {
  if (path.startsWith('http')) {
    return path;
  }

  return `${apiBaseUrl}${path}`;
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const musicService = {
  getMusic(query = '') {
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    return request<FavoriteMusic[]>(`/api/music${params}`);
  },

  resolveAudioUrl(track: FavoriteMusic) {
    return track.audioUrl ? toApiUrl(track.audioUrl) : '';
  },

  resolveUrl(path: string) {
    return toApiUrl(path);
  },
};
