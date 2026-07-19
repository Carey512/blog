import type { FavoriteMusic, MusicCategory, MusicCategoryId } from '@blog/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000';

function toApiUrl(path: string) {
  if (path.startsWith('http')) {
    return path;
  }

  return `${apiBaseUrl}${path}`;
}

function getCurrentProtocol() {
  return typeof window === 'undefined' ? 'https:' : window.location.protocol;
}

function getCurrentHref() {
  return typeof window === 'undefined' ? 'https://example.com/' : window.location.href;
}

function extractEmbedSrc(value: string) {
  return value.match(/src=["']([^"']+)["']/i)?.[1] ?? value;
}

function normalizeEmbedUrl(value: string, options: { autoplay?: boolean } = {}) {
  const embedValue = extractEmbedSrc(value.trim());

  if (!embedValue) {
    return '';
  }

  try {
    const url = new URL(embedValue, getCurrentHref());

    if (url.hostname === 'music.163.com' && url.pathname.includes('/outchain/player')) {
      url.protocol = getCurrentProtocol() === 'http:' ? 'http:' : 'https:';
      url.searchParams.set('auto', options.autoplay ? '1' : '0');

      if (!url.searchParams.has('height')) {
        url.searchParams.set('height', '66');
      }
    }

    return url.toString();
  } catch {
    return embedValue;
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const musicService = {
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

  resolveEmbedUrl(track: FavoriteMusic, options: { autoplay?: boolean } = {}) {
    const embedValue = track.embedUrl?.trim() ?? '';
    return normalizeEmbedUrl(embedValue, options);
  },

  isPlayable(track: FavoriteMusic) {
    return Boolean(track.audioUrl || track.embedUrl);
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
