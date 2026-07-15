import type { ApiPost, Category as ApiCategory, CreatePostBody, PostCategoryId, PostStatus } from '@blog/shared';

export type Post = ApiPost;
export type Category = PostCategoryId;
export type BlogCategory = ApiCategory;
export type CategoryFilter = Category | 'all';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000';

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

export const blogService = {
  getCategories(): Promise<BlogCategory[]> {
    return request<BlogCategory[]>('/api/categories');
  },

  getPosts(status?: PostStatus): Promise<Post[]> {
    const query = status ? `?status=${status}` : '';
    return request<Post[]>(`/api/posts${query}`);
  },

  getFeaturedPost(posts: Post[]): Post | undefined {
    return posts.find((post) => post.featured) ?? posts[0];
  },

  getPostById(postId: string): Promise<Post> {
    return request<Post>(`/api/posts/${postId}`);
  },

  createPost(body: CreatePostBody, token: string): Promise<Post> {
    return request<Post>('/api/posts', {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'POST',
    });
  },

  getCategoryCounts(posts: Post[], categories: BlogCategory[]): Array<{ id: Category; count: number }> {
    return categories
      .map((category) => ({
        id: category.id,
        count: posts.filter((post) => post.categoryId === category.id).length,
      }));
  },
};
