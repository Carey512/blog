import type {
  ApiEndpointInfo,
  ApiPost,
  AuthLoginResponse,
  CreateMusicBody,
  CreatePostBody,
  FavoriteMusic,
  UpdatePostBody,
  User,
  WorkDoc,
  WorkDocCategory,
} from '@blog/shared';

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

  users(token: string, query = '') {
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    return request<User[]>(`/api/users${params}`, {
      headers: authorizationHeader(token),
    });
  },

  deleteUser(token: string, userId: string) {
    return request<{ deletedUser: User; ok: boolean }>(`/api/users/${userId}`, {
      headers: authorizationHeader(token),
      method: 'DELETE',
    });
  },

  endpoints(token: string) {
    return request<ApiEndpointInfo[]>('/api/meta/endpoints', {
      headers: authorizationHeader(token),
    });
  },

  docs(params?: { category?: WorkDocCategory | 'all'; query?: string }) {
    const search = new URLSearchParams();

    if (params?.query?.trim()) {
      search.set('q', params.query.trim());
    }

    if (params?.category && params.category !== 'all') {
      search.set('category', params.category);
    }

    const query = search.toString();
    return request<WorkDoc[]>(`/api/docs${query ? `?${query}` : ''}`);
  },

  createPost(body: CreatePostBody, token: string) {
    return request<ApiPost>('/api/posts', {
      body: JSON.stringify(body),
      headers: authorizationHeader(token),
      method: 'POST',
    });
  },

  updatePost(postId: string, body: UpdatePostBody, token: string) {
    return request<ApiPost>(`/api/posts/${postId}`, {
      body: JSON.stringify(body),
      headers: authorizationHeader(token),
      method: 'PUT',
    });
  },

  deletePost(postId: string, token: string) {
    return request<{ deletedPost: ApiPost; ok: boolean }>(`/api/posts/${postId}`, {
      headers: authorizationHeader(token),
      method: 'DELETE',
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
