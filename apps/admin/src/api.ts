import type {
  AdminOverviewItem,
  ApiEndpointInfo,
  ApiPost,
  AuthLoginResponse,
  CreateMusicBody,
  CreatePostBody,
  FavoriteMusic,
  MusicCategory,
  MusicCategoryId,
  UpdatePostBody,
  User,
  WorkDoc,
  WorkDocCategory,
} from '@blog/shared';

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...restOptions } = options ?? {};
  const requestHeaders: HeadersInit = {
    ...(restOptions.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string> | undefined),
  };
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...restOptions,
    headers: requestHeaders,
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
  docHtmlUrl(htmlFile: string) {
    return `${apiBaseUrl}/docs-html/${encodeURIComponent(htmlFile)}`;
  },

  health() {
    return request<{ ok: boolean; service: string; time: string }>('/health');
  },

  overview(token: string) {
    return request<{ modules: AdminOverviewItem[] }>('/api/admin/overview', {
      headers: authorizationHeader(token),
    });
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

  refreshPosts(token: string) {
    return request<{ ok: boolean; posts: ApiPost[]; refreshedAt: string }>('/api/posts/refresh', {
      headers: authorizationHeader(token),
      method: 'POST',
    });
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

  createDoc(formData: FormData, token: string) {
    return uploadRequest<WorkDoc>('/api/docs', formData, token);
  },

  updateDoc(docId: string, formData: FormData, token: string) {
    const response = fetch(`${apiBaseUrl}/api/docs/${docId}`, {
      body: formData,
      headers: authorizationHeader(token),
      method: 'PUT',
    });

    return response.then((result) => {
      if (!result.ok) {
        throw new Error(`Request failed: ${result.status}`);
      }

      return result.json() as Promise<WorkDoc>;
    });
  },

  deleteDoc(docId: string, token: string) {
    return request<{ deletedDoc: WorkDoc; ok: boolean }>(`/api/docs/${docId}`, {
      headers: authorizationHeader(token),
      method: 'DELETE',
    });
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

  favoriteMusic(params?: { category?: MusicCategoryId | 'all'; query?: string }) {
    const search = new URLSearchParams();

    if (params?.query?.trim()) {
      search.set('q', params.query.trim());
    }

    if (params?.category && params.category !== 'all') {
      search.set('category', params.category);
    }

    const query = search.toString();
    return request<FavoriteMusic[]>(`/api/music${query ? `?${query}` : ''}`);
  },

  musicCategories() {
    return request<MusicCategory[]>('/api/music/categories');
  },

  uploadMusic(formData: FormData, token: string) {
    return uploadRequest<FavoriteMusic>('/api/music/upload', formData, token);
  },

  updateMusic(musicId: string, body: CreateMusicBody, token: string) {
    return request<FavoriteMusic>(`/api/music/${musicId}`, {
      body: JSON.stringify(body),
      headers: authorizationHeader(token),
      method: 'PUT',
    });
  },

  deleteMusic(musicId: string, token: string) {
    return request<{ deletedMusic: FavoriteMusic; ok: boolean }>(`/api/music/${musicId}`, {
      headers: authorizationHeader(token),
      method: 'DELETE',
    });
  },
};
