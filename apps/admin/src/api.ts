import type { ApiPost, AuthLoginResponse, CreateMusicBody, CreatePostBody, FavoriteMusic } from '@blog/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...restOptions } = options ?? {};
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function uploadRequest<T>(path: string, formData: FormData, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: formData,
    headers: authorizationHeader(token),
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function authorizationHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const adminApi = {
  health() {
    return request<{ ok: boolean; service: string; time: string }>('/health');
  },

  login(email: string, password: string) {
    return request<AuthLoginResponse>('/api/auth/login', {
      body: JSON.stringify({ email, password }),
      method: 'POST',
    });
  },

  posts() {
    return request<ApiPost[]>('/api/posts');
  },

  createPost(body: CreatePostBody, token: string) {
    return request<ApiPost>('/api/posts', {
      body: JSON.stringify(body),
      headers: authorizationHeader(token),
      method: 'POST',
    });
  },

  favoriteMusic() {
    return request<FavoriteMusic[]>('/api/music');
  },

  createMusic(body: CreateMusicBody, token: string) {
    return request<FavoriteMusic>('/api/music', {
      body: JSON.stringify(body),
      headers: authorizationHeader(token),
      method: 'POST',
    });
  },

  uploadMusic(formData: FormData, token: string) {
    return uploadRequest<FavoriteMusic>('/api/music/upload', formData, token);
  },
};
