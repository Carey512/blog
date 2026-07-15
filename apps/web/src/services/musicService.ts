import type { FavoriteMusic, MusicCategory, MusicCategoryId } from '@blog/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000';

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
  createMusic(
    body: {
      album?: string;
      artist: string;
      audioUrl?: string;
      categoryId?: MusicCategoryId;
      cover?: string;
      platform?: string;
      title: string;
      url?: string;
    },
    token: string,
  ) {
    return fetch(`${apiBaseUrl}/api/music`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return response.json() as Promise<FavoriteMusic>;
    });
  },

  getMusic(params: { category?: MusicCategoryId | 'all'; query?: string } = {}) {
    const search = new URLSearchParams();

    if (params.query?.trim()) {
      search.set('q', params.query.trim());
    }

    if (params.category && params.category !== 'all') {
      search.set('category', params.category);
    }

    const query = search.toString();
    return request<FavoriteMusic[]>(`/api/music${query ? `?${query}` : ''}`);
  },

  getMusicCategories() {
    return request<MusicCategory[]>('/api/music/categories');
  },

  resolveAudioUrl(track: FavoriteMusic) {
    return track.audioUrl ? toApiUrl(track.audioUrl) : '';
  },

  resolveUrl(path: string) {
    return toApiUrl(path);
  },

  uploadMusic(formData: FormData, token: string) {
    return fetch(`${apiBaseUrl}/api/music/upload`, {
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'POST',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return response.json() as Promise<FavoriteMusic>;
    });
  },
};
