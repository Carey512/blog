import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale, PostCategoryId } from '@blog/shared';
import { messages } from '../i18n';
import { blogService, type BlogCategory } from '../services/blogService';

type CategoriesContextValue = {
  categories: BlogCategory[];
  error: string;
  getCategoryLabel: (categoryId: PostCategoryId, locale: Locale) => string;
  loading: boolean;
};

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      try {
        setLoading(true);
        setError('');
        const nextCategories = await blogService.getCategories();

        if (alive) {
          setCategories(nextCategories);
        }
      } catch {
        if (alive) {
          setError('failed');
          setCategories([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      error,
      getCategoryLabel: (categoryId, locale) =>
        categories.find((category) => category.id === categoryId)?.name[locale] ??
        messages[locale].categories[categoryId],
      loading,
    }),
    [categories, error, loading],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const value = useContext(CategoriesContext);

  if (!value) {
    throw new Error('useCategories must be used inside CategoriesProvider');
  }

  return value;
}
