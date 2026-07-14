import type { WorkDoc, WorkDocCategory } from '@blog/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const docsService = {
  getDocs(params?: { category?: WorkDocCategory | 'all'; query?: string }) {
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

  getDocById(docId: string) {
    return request<WorkDoc>(`/api/docs/${docId}`);
  },
};
