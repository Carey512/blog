export type Locale = 'zh-CN' | 'en-US';

export type Role = 'admin' | 'author' | 'reader';

export type PostCategoryId = 'design' | 'engineering' | 'culture' | 'notes';

export type PostStatus = 'draft' | 'published' | 'review';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Category = {
  id: PostCategoryId;
  name: Record<Locale, string>;
};

export type LocalizedPostContent = {
  title: string;
  excerpt: string;
  author: string;
  body: string[];
};

export type ApiPost = {
  id: string;
  categoryId: PostCategoryId;
  authorId: string;
  status: PostStatus;
  featured?: boolean;
  cover: string;
  publishedAt: string;
  date: string;
  readingMinutes: number;
  content: Record<Locale, LocalizedPostContent>;
};

export type CreatePostBody = {
  categoryId: PostCategoryId;
  status: PostStatus;
  featured?: boolean;
  cover?: string;
  readingMinutes?: number;
  content: Record<Locale, LocalizedPostContent>;
};

export type FavoriteMusic = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  audioUrl?: string;
  platform?: string;
  url?: string;
  source: 'upload' | 'external';
  createdAt: string;
};

export type CreateMusicBody = {
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  audioUrl?: string;
  platform?: string;
  url?: string;
};

export type AuthLoginBody = {
  email: string;
  password: string;
};

export type AuthLoginResponse = {
  token: string;
  user: User;
};
