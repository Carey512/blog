import type { Locale } from '@blog/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export type AboutCard = {
  body: Record<Locale, string>;
  icon: 'database' | 'layers' | 'palette';
  id: string;
  title: Record<Locale, string>;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const siteService = {
  getAboutCards() {
    return request<AboutCard[]>('/api/about/cards');
  },
};
