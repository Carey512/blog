import type { WorkDoc, WorkDocCategory } from '@blog/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const docsService = {
  createDoc(formData: FormData, token: string) {
    return fetch(`${apiBaseUrl}/api/docs`, {
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'POST',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return response.json() as Promise<WorkDoc>;
    });
  },

  getDocHtmlUrl(htmlFile: string) {
    return `${apiBaseUrl}/docs-html/${encodeURIComponent(htmlFile)}`;
  },

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
