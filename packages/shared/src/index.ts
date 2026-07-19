export type Locale = 'zh-CN' | 'en-US';

export type Role = 'admin' | 'author' | 'reader';

export type PostCategoryId = 'design' | 'engineering' | 'culture' | 'notes';

export type PostStatus = 'draft' | 'published' | 'review';

export type WorkDocCategory = 'deployment' | 'shortcut' | 'workflow' | 'reference';

export type MusicCategoryId = 'mandarin' | 'instrumental' | 'live' | 'personal';

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

export type MusicCategory = {
  id: MusicCategoryId;
  name: Record<Locale, string>;
};

export type LocalizedWorkDocContent = {
  title: string;
  summary: string;
  body: string[];
  sections?: WorkDocSection[];
};

export type WorkDocSection = {
  title: string;
  items: string[];
};

export type WorkDoc = {
  id: string;
  category: WorkDocCategory;
  tags: string[];
  updatedAt: string;
  htmlFile?: string;
  content: Record<Locale, LocalizedWorkDocContent>;
};

export type CreateWorkDocBody = {
  category: WorkDocCategory;
  tags?: string[];
  updatedAt?: string;
  html?: string;
  content: Record<Locale, LocalizedWorkDocContent>;
};

export type UpdateWorkDocBody = CreateWorkDocBody;

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
  cover?: string;
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

export type UpdatePostBody = CreatePostBody;

export type FavoriteMusic = {
  id: string;
  categoryId: MusicCategoryId;
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
  categoryId?: MusicCategoryId;
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

export type AuthRegisterBody = {
  email: string;
  name: string;
  password: string;
};

export type AuthLoginResponse = {
  token: string;
  user: User;
};

export type ApiAudience = 'web' | 'admin';

export type ApiAuthLevel = 'public' | 'user' | 'admin';

export type ApiMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export type ApiEndpointInfo = {
  id: string;
  method: ApiMethod;
  path: string;
  title: string;
  description: string;
  module: string;
  auth: ApiAuthLevel;
  audiences: ApiAudience[];
};

export type AdminOverviewModule =
  | 'articles'
  | 'docs'
  | 'music'
  | 'tools'
  | 'users'
  | 'endpoints';

export type AdminOverviewItem = {
  module: AdminOverviewModule;
  count: number;
};
