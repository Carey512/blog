import {
  BookOpenCheck,
  BookOpenText,
  Eye,
  Gauge,
  Headphones,
  Link as LinkIcon,
  LogIn,
  LogOut,
  Megaphone,
  Music2,
  Newspaper,
  Plus,
  RadioTower,
  RefreshCw,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
  UsersRound,
  X,
} from 'lucide-react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type {
  ApiAudience,
  ApiEndpointInfo,
  ApiPost,
  AuthLoginResponse,
  CreateMusicBody,
  CreatePostBody,
  FavoriteMusic,
  PostCategoryId,
  PostStatus,
  UpdatePostBody,
  User,
  WorkDoc,
  WorkDocCategory,
} from '@blog/shared';
import { adminApi } from './api';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const adminAuthStorageKey = 'blog-admin-auth';
const routerBasename = resolveRouterBasename(import.meta.env.BASE_URL);

const modules = [
  { label: '总览', path: '/', Icon: Gauge },
  { label: '文章管理', path: '/articles', Icon: Newspaper },
  { label: '笔记文档', path: '/docs', Icon: BookOpenText },
  { label: '音乐管理', path: '/music', Icon: Headphones },
  { label: '用户管理', path: '/users', Icon: UsersRound },
  { label: '接口配置详情', path: '/api-config', Icon: LinkIcon },
  { label: '知识源', path: '/knowledge', Icon: RadioTower },
  { label: '分享配置', path: '/sharing', Icon: Share2 },
];

function App() {
  return (
    <BrowserRouter basename={routerBasename} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AdminAuthGate />
    </BrowserRouter>
  );
}

function resolveRouterBasename(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, '');
  return normalized === '' ? undefined : normalized;
}

function AdminAuthGate() {
  const [auth, setAuth] = useState<AuthLoginResponse | null>(() => readStoredAuth());
  const [captcha, setCaptcha] = useState(() => createCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [email, setEmail] = useState('admin@example.com');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);

  function refreshCaptcha() {
    setCaptcha(createCaptcha());
    setCaptchaInput('');
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (captchaInput.trim() !== captcha.answer) {
      setError('验证码不正确，请重新输入。');
      refreshCaptcha();
      return;
    }

    try {
      setSubmitting(true);
      const result = await adminApi.login(email, password);
      window.localStorage.setItem(adminAuthStorageKey, JSON.stringify(result));
      setAuth(result);
    } catch {
      setError('登录失败，请确认后端已启动，账号密码正确。');
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(adminAuthStorageKey);
    setAuth(null);
    refreshCaptcha();
  }

  if (!auth) {
    return (
      <AdminLoginPage
        captchaInput={captchaInput}
        captchaQuestion={captcha.question}
        email={email}
        error={error}
        onCaptchaChange={setCaptchaInput}
        onEmailChange={setEmail}
        onLogin={handleLogin}
        onPasswordChange={setPassword}
        onRefreshCaptcha={refreshCaptcha}
        password={password}
        submitting={submitting}
      />
    );
  }

  return <AdminConsole auth={auth} onLogout={handleLogout} />;
}

function AdminLoginPage({
  captchaInput,
  captchaQuestion,
  email,
  error,
  onCaptchaChange,
  onEmailChange,
  onLogin,
  onPasswordChange,
  onRefreshCaptcha,
  password,
  submitting,
}: {
  captchaInput: string;
  captchaQuestion: string;
  email: string;
  error: string;
  onCaptchaChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onPasswordChange: (value: string) => void;
  onRefreshCaptcha: () => void;
  password: string;
  submitting: boolean;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10 text-ink">
      <form className="w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-panel" onSubmit={onLogin}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand">Blog Admin</p>
            <h1 className="text-2xl font-semibold">管理后台登录</h1>
          </div>
        </div>

        <TextField label="账号邮箱" onChange={onEmailChange} type="email" value={email} />
        <TextField label="密码" onChange={onPasswordChange} type="password" value={password} />

        <label className="mt-4 block text-sm font-medium">
          验证码
          <div className="mt-2 grid grid-cols-[1fr_120px_44px] gap-2">
            <input
              className="h-11 rounded-lg border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              onChange={(event) => onCaptchaChange(event.target.value)}
              value={captchaInput}
            />
            <span className="grid h-11 place-items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold text-ink">
              {captchaQuestion}
            </span>
            <button
              aria-label="刷新验证码"
              className="grid h-11 place-items-center rounded-lg border border-line bg-white text-slate-600 transition hover:text-ink"
              onClick={onRefreshCaptcha}
              type="button"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </label>

        {error ? <p className="mt-3 text-sm font-medium text-coral">{error}</p> : null}

        <button
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>
    </main>
  );
}

function AdminConsole({ auth, onLogout }: { auth: AuthLoginResponse; onLogout: () => void }) {
  const [serverState, setServerState] = useState<LoadState>('idle');
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointInfo[]>([]);
  const [docs, setDocs] = useState<WorkDoc[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [music, setMusic] = useState<FavoriteMusic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deleteUserMessage, setDeleteUserMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [postTitleZh, setPostTitleZh] = useState('后台发布的新文章');
  const [postTitleEn, setPostTitleEn] = useState('A new post from admin');
  const [postExcerptZh, setPostExcerptZh] = useState('这篇文章来自管理后台，发布后会出现在前台文章列表。');
  const [postExcerptEn, setPostExcerptEn] = useState(
    'This post comes from the admin app and appears on the public site after publishing.',
  );
  const [postCategoryId, setPostCategoryId] = useState<PostCategoryId>('notes');
  const [postStatus, setPostStatus] = useState<PostStatus>('published');
  const [createPostMessage, setCreatePostMessage] = useState('');
  const [postActionMessage, setPostActionMessage] = useState('');

  const [musicTitle, setMusicTitle] = useState('My favorite track');
  const [musicArtist, setMusicArtist] = useState('Unknown Artist');
  const [musicAlbum, setMusicAlbum] = useState('');
  const [musicCover, setMusicCover] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [createMusicMessage, setCreateMusicMessage] = useState('');

  async function loadOverview() {
    try {
      setServerState('loading');
      const [health, postList, musicList, userList, endpointList, docList] = await Promise.all([
        adminApi.health(),
        adminApi.posts(),
        adminApi.favoriteMusic(),
        adminApi.users(auth.token),
        adminApi.endpoints(auth.token),
        adminApi.docs(),
      ]);
      setPosts(postList);
      setMusic(musicList);
      setUsers(userList);
      setApiEndpoints(endpointList);
      setDocs(docList);
      setServerState(health.ok ? 'ready' : 'error');
    } catch {
      setServerState('error');
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  const publishedCount = useMemo(
    () => posts.filter((post) => post.status === 'published').length,
    [posts],
  );

  async function handleUserSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      const userList = await adminApi.users(auth.token, userSearch);
      setUsers(userList);
    } catch {
      setUsers([]);
    }
  }

  async function handleDeleteUser(user: User) {
    setDeleteUserMessage('');

    if (user.id === auth.user.id) {
      setDeleteUserMessage('不能删除当前登录账号。');
      return;
    }

    if (!window.confirm(`确认删除用户 ${user.name} (${user.email}) 吗？`)) {
      return;
    }

    try {
      await adminApi.deleteUser(auth.token, user.id);
      const userList = await adminApi.users(auth.token, userSearch);
      setUsers(userList);
      setDeleteUserMessage(`已删除用户：${user.name}`);
    } catch {
      setDeleteUserMessage('删除失败，请确认账号权限和后端服务状态。');
    }
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatePostMessage('');
    setPostActionMessage('');

    const body: CreatePostBody = {
      categoryId: postCategoryId,
      content: {
        'zh-CN': {
          author: auth.user.name,
          body: [postExcerptZh],
          excerpt: postExcerptZh,
          title: postTitleZh,
        },
        'en-US': {
          author: auth.user.name,
          body: [postExcerptEn],
          excerpt: postExcerptEn,
          title: postTitleEn,
        },
      },
      readingMinutes: 5,
      status: postStatus,
    };

    try {
      const created = await adminApi.createPost(body, auth.token);
      setCreatePostMessage(`已创建：${created.content['zh-CN'].title}`);
      await loadOverview();
    } catch {
      setCreatePostMessage('创建失败，请确认登录状态和后端服务。');
    }
  }

  async function handleUpdatePost(postId: string, body: UpdatePostBody) {
    setPostActionMessage('');

    try {
      const updated = await adminApi.updatePost(postId, body, auth.token);
      setPosts((currentPosts) => currentPosts.map((post) => (post.id === updated.id ? updated : post)));
      setPostActionMessage(`已更新文章：${updated.content['zh-CN'].title}`);
      return updated;
    } catch {
      setPostActionMessage('更新失败，请确认管理员权限和后端服务状态。');
      throw new Error('Update post failed');
    }
  }

  async function handleDeletePost(post: ApiPost) {
    setPostActionMessage('');

    try {
      await adminApi.deletePost(post.id, auth.token);
      setPosts((currentPosts) => currentPosts.filter((item) => item.id !== post.id));
      setPostActionMessage(`已删除文章：${post.content['zh-CN'].title}`);
    } catch {
      setPostActionMessage('删除失败，请确认管理员权限和后端服务状态。');
      throw new Error('Delete post failed');
    }
  }

  async function handleCreateMusic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateMusicMessage('');

    try {
      let created: FavoriteMusic;

      if (musicFile) {
        const formData = new FormData();
        formData.append('title', musicTitle);
        formData.append('artist', musicArtist);
        formData.append('album', musicAlbum);
        formData.append('cover', musicCover);
        formData.append('file', musicFile);
        created = await adminApi.uploadMusic(formData, auth.token);
      } else {
        const body: CreateMusicBody = {
          album: musicAlbum || undefined,
          artist: musicArtist,
          audioUrl: musicUrl || undefined,
          cover: musicCover || undefined,
          platform: musicUrl ? 'External Audio' : undefined,
          title: musicTitle,
          url: musicUrl || undefined,
        };
        created = await adminApi.createMusic(body, auth.token);
      }

      setCreateMusicMessage(`已保存音乐：${created.title}`);
      setMusicFile(null);
      await loadOverview();
    } catch {
      setCreateMusicMessage('保存失败，请确认登录状态、后端服务和文件大小。');
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-panel px-4 py-5 lg:block">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">Blog Admin</p>
            <p className="text-xs text-slate-500">{auth.user.name}</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1 text-sm font-medium text-slate-600">
          {modules.map(({ Icon, label, path }) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                  isActive ? 'bg-slate-100 text-ink' : 'hover:bg-slate-100 hover:text-ink'
                }`
              }
              end={path === '/'}
              key={path}
              to={path}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-64">
        <header className="border-b border-line bg-panel px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand">管理后台</p>
              <h1 className="mt-1 text-2xl font-semibold">内容与用户控制台</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge state={serverState} />
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-slate-600 transition hover:text-ink"
                onClick={onLogout}
                type="button"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                退出
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {modules.map(({ label, path }) => (
              <NavLink
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold ${
                    isActive ? 'border-brand bg-brand text-white' : 'border-line bg-panel text-slate-600'
                  }`
                }
                end={path === '/'}
                key={path}
                to={path}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <Routes>
            <Route
              element={<DashboardPage music={music} posts={posts} publishedCount={publishedCount} />}
              path="/"
            />
            <Route
              element={
                <ArticlesAdminPage
                  actionMessage={postActionMessage}
                  createMessage={createPostMessage}
                  onCreatePost={handleCreatePost}
                  onDeletePost={handleDeletePost}
                  onUpdatePost={handleUpdatePost}
                  postCategoryId={postCategoryId}
                  postExcerptEn={postExcerptEn}
                  postExcerptZh={postExcerptZh}
                  posts={posts}
                  postStatus={postStatus}
                  postTitleEn={postTitleEn}
                  postTitleZh={postTitleZh}
                  setPostCategoryId={setPostCategoryId}
                  setPostExcerptEn={setPostExcerptEn}
                  setPostExcerptZh={setPostExcerptZh}
                  setPostStatus={setPostStatus}
                  setPostTitleEn={setPostTitleEn}
                  setPostTitleZh={setPostTitleZh}
                />
              }
              path="/articles"
            />
            <Route element={<DocsAdminPage docs={docs} />} path="/docs" />
            <Route
              element={
                <MusicAdminPage
                  createMessage={createMusicMessage}
                  music={music}
                  musicAlbum={musicAlbum}
                  musicArtist={musicArtist}
                  musicCover={musicCover}
                  musicFile={musicFile}
                  musicTitle={musicTitle}
                  musicUrl={musicUrl}
                  onCreateMusic={handleCreateMusic}
                  setMusicAlbum={setMusicAlbum}
                  setMusicArtist={setMusicArtist}
                  setMusicCover={setMusicCover}
                  setMusicFile={setMusicFile}
                  setMusicTitle={setMusicTitle}
                  setMusicUrl={setMusicUrl}
                />
              }
              path="/music"
            />
            <Route
              element={
                <UsersAdminPage
                  currentUserId={auth.user.id}
                  deleteMessage={deleteUserMessage}
                  onDeleteUser={handleDeleteUser}
                  onSearch={handleUserSearch}
                  search={userSearch}
                  setSearch={setUserSearch}
                  users={users}
                />
              }
              path="/users"
            />
            <Route element={<ApiConfigPage endpoints={apiEndpoints} />} path="/api-config" />
            <Route element={<PlaceholderPage title="知识源" body="后续接入 RSS、GitHub、技术资讯源和定时抓取。" />} path="/knowledge" />
            <Route element={<PlaceholderPage title="分享配置" body="后续接入分享卡片、公开分享页和朋友圈素材配置。" />} path="/sharing" />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function DashboardPage({
  music,
  posts,
  publishedCount,
}: {
  music: FavoriteMusic[];
  posts: ApiPost[];
  publishedCount: number;
}) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard color="brand" icon={<BookOpenCheck />} label="文章总数" value={posts.length} />
        <MetricCard color="mint" icon={<Newspaper />} label="已发布" value={publishedCount} />
        <MetricCard color="amber" icon={<Megaphone />} label="待处理" value={posts.length - publishedCount} />
        <MetricCard color="coral" icon={<Headphones />} label="音乐总数" value={music.length} />
      </div>
      <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
        <h2 className="text-lg font-semibold">模块入口</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ModuleHint icon={<Newspaper />} title="文章" body="发布后进入 web 文章路由。" />
          <ModuleHint icon={<Music2 />} title="音乐" body="上传后进入 web 音乐路由并可播放。" />
          <ModuleHint icon={<Share2 />} title="分享" body="后续生成公开分享页与素材。" />
        </div>
      </section>
    </section>
  );
}

function ArticlesAdminPage({
  actionMessage,
  createMessage,
  onCreatePost,
  onDeletePost,
  onUpdatePost,
  postCategoryId,
  postExcerptEn,
  postExcerptZh,
  posts,
  postStatus,
  postTitleEn,
  postTitleZh,
  setPostCategoryId,
  setPostExcerptEn,
  setPostExcerptZh,
  setPostStatus,
  setPostTitleEn,
  setPostTitleZh,
}: {
  actionMessage: string;
  createMessage: string;
  onCreatePost: (event: FormEvent<HTMLFormElement>) => void;
  onDeletePost: (post: ApiPost) => Promise<void>;
  onUpdatePost: (postId: string, body: UpdatePostBody) => Promise<ApiPost>;
  postCategoryId: PostCategoryId;
  postExcerptEn: string;
  postExcerptZh: string;
  posts: ApiPost[];
  postStatus: PostStatus;
  postTitleEn: string;
  postTitleZh: string;
  setPostCategoryId: (value: PostCategoryId) => void;
  setPostExcerptEn: (value: string) => void;
  setPostExcerptZh: (value: string) => void;
  setPostStatus: (value: PostStatus) => void;
  setPostTitleEn: (value: string) => void;
  setPostTitleZh: (value: string) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<PostCategoryId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'open-source' | 'personal'>('all');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const openSourceCount = useMemo(() => posts.filter(isOpenSourcePost).length, [posts]);
  const personalUploadCount = posts.length - openSourceCount;
  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const translated = post.content['zh-CN'];
        const normalizedQuery = query.trim().toLowerCase();
        const matchesQuery = normalizedQuery
          ? [post.id, translated.title, translated.excerpt, translated.author, post.content['en-US'].title]
              .some((value) => value.toLowerCase().includes(normalizedQuery))
          : true;
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || post.categoryId === categoryFilter;
        const matchesSource =
          sourceFilter === 'all' ||
          (sourceFilter === 'open-source' ? isOpenSourcePost(post) : !isOpenSourcePost(post));

        return matchesQuery && matchesStatus && matchesCategory && matchesSource;
      }),
    [categoryFilter, posts, query, sourceFilter, statusFilter],
  );

  return (
    <section className="space-y-4">
      <div className={showCreatePostForm ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]' : 'grid gap-4'}>
      <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">文章管理</h2>
            <p className="mt-1 text-sm text-slate-500">筛选、查看详情、编辑和删除文章。</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[28rem]">
            <ApiSummaryItem label="文章总数" value={posts.length} />
            <ApiSummaryItem label="开源数" value={openSourceCount} />
            <ApiSummaryItem label="个人上传数" value={personalUploadCount} />
          </div>
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_140px_140px_112px]">
          <label className="relative min-w-0">
            <span className="sr-only">搜索文章</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-10 w-full rounded-lg border border-line pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、摘要、作者或 ID"
              value={query}
            />
          </label>
          <select
            className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            onChange={(event) => setStatusFilter(event.target.value as PostStatus | 'all')}
            value={statusFilter}
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="review">审核中</option>
            <option value="draft">草稿</option>
          </select>
          <select
            className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            onChange={(event) => setCategoryFilter(event.target.value as PostCategoryId | 'all')}
            value={categoryFilter}
          >
            <option value="all">全部分类</option>
            <option value="notes">随笔</option>
            <option value="design">设计</option>
            <option value="engineering">工程</option>
            <option value="culture">文化</option>
          </select>
          <select
            className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            onChange={(event) => setSourceFilter(event.target.value as 'all' | 'open-source' | 'personal')}
            value={sourceFilter}
          >
            <option value="all">全部来源</option>
            <option value="open-source">开源</option>
            <option value="personal">个人上传</option>
          </select>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white transition hover:bg-brand/90"
            onClick={() => setShowCreatePostForm((current) => !current)}
            type="button"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {showCreatePostForm ? '收起' : '新增'}
          </button>
        </div>

        {actionMessage ? <p className="mt-3 text-sm font-medium text-brand">{actionMessage}</p> : null}

        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          {filteredPosts.length ? (
            filteredPosts.map((post) => (
              <div
                className="grid gap-2 border-b border-line px-3 py-2 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_92px_92px_96px_88px] lg:items-center"
                key={post.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{post.content['zh-CN'].title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{post.content['zh-CN'].excerpt}</p>
                </div>
                <span className="text-xs text-slate-500">{post.publishedAt}</span>
                <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {getPostStatusLabel(post.status)}
                </span>
                <span className="text-xs text-slate-500">{getPostSourceLabel(post)}</span>
                <button
                  className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-brand transition hover:bg-slate-50"
                  onClick={() => setSelectedPost(post)}
                  type="button"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  详情
                </button>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-500">暂无匹配文章</div>
          )}
        </div>
      </section>

      {showCreatePostForm ? (
      <form className="animate-panel-in rounded-lg border border-line bg-panel p-5 shadow-panel xl:sticky xl:top-4 xl:self-start" onSubmit={onCreatePost}>
        <h2 className="font-semibold">新建文章</h2>
        <p className="mt-1 text-xs text-slate-500">发布状态的文章会进入 web /articles。</p>
        <TextField label="中文标题" onChange={setPostTitleZh} value={postTitleZh} />
        <TextAreaField label="中文摘要" onChange={setPostExcerptZh} value={postExcerptZh} />
        <TextField label="英文标题" onChange={setPostTitleEn} value={postTitleEn} />
        <TextAreaField label="英文摘要" onChange={setPostExcerptEn} value={postExcerptEn} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            分类
            <select
              className="mt-2 h-11 w-full rounded-lg border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              onChange={(event) => setPostCategoryId(event.target.value as PostCategoryId)}
              value={postCategoryId}
            >
              <option value="notes">随笔</option>
              <option value="design">设计</option>
              <option value="engineering">工程</option>
              <option value="culture">文化</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            状态
            <select
              className="mt-2 h-11 w-full rounded-lg border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              onChange={(event) => setPostStatus(event.target.value as PostStatus)}
              value={postStatus}
            >
              <option value="published">发布</option>
              <option value="review">审核</option>
              <option value="draft">草稿</option>
            </select>
          </label>
        </div>
        {createMessage ? <p className="mt-3 text-sm text-mint">{createMessage}</p> : null}
        <button className="mt-5 h-11 w-full rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="submit">
          保存文章
        </button>
      </form>
      ) : null}
      </div>

      {selectedPost ? (
        <ArticleDetailModal
          onClose={() => setSelectedPost(null)}
          onDelete={async (post) => {
            await onDeletePost(post);
            setSelectedPost(null);
          }}
          onUpdate={async (postId, body) => {
            const updated = await onUpdatePost(postId, body);
            setSelectedPost(updated);
            return updated;
          }}
          post={selectedPost}
        />
      ) : null}
    </section>
  );
}

function ArticleDetailModal({
  onClose,
  onDelete,
  onUpdate,
  post,
}: {
  onClose: () => void;
  onDelete: (post: ApiPost) => Promise<void>;
  onUpdate: (postId: string, body: UpdatePostBody) => Promise<ApiPost>;
  post: ApiPost;
}) {
  const [categoryId, setCategoryId] = useState<PostCategoryId>(post.categoryId);
  const [cover, setCover] = useState(post.cover);
  const [deletePending, setDeletePending] = useState(false);
  const [excerptEn, setExcerptEn] = useState(post.content['en-US'].excerpt);
  const [excerptZh, setExcerptZh] = useState(post.content['zh-CN'].excerpt);
  const [message, setMessage] = useState('');
  const [readingMinutes, setReadingMinutes] = useState(String(post.readingMinutes));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [titleEn, setTitleEn] = useState(post.content['en-US'].title);
  const [titleZh, setTitleZh] = useState(post.content['zh-CN'].title);
  const [bodyEn, setBodyEn] = useState(post.content['en-US'].body.join('\n'));
  const [bodyZh, setBodyZh] = useState(post.content['zh-CN'].body.join('\n'));

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSaving(true);

    const body: UpdatePostBody = {
      categoryId,
      content: {
        'en-US': {
          author: post.content['en-US'].author,
          body: splitBodyLines(bodyEn),
          excerpt: excerptEn,
          title: titleEn,
        },
        'zh-CN': {
          author: post.content['zh-CN'].author,
          body: splitBodyLines(bodyZh),
          excerpt: excerptZh,
          title: titleZh,
        },
      },
      cover,
      featured: post.featured,
      readingMinutes: Number(readingMinutes) || post.readingMinutes,
      status,
    };

    try {
      await onUpdate(post.id, body);
      setMessage('文章详情已保存。');
    } catch {
      setMessage('保存失败，请稍后再试。');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setMessage('');

    if (!window.confirm(`确认删除文章《${post.content['zh-CN'].title}》吗？`)) {
      return;
    }

    setDeletePending(true);

    try {
      await onDelete(post);
    } catch {
      setMessage('删除失败，请稍后再试。');
      setDeletePending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-6">
      <form
        className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-line bg-panel shadow-panel"
        onSubmit={handleSave}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">文章详情</p>
            <h2 className="truncate text-lg font-semibold">{post.content['zh-CN'].title}</h2>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-500 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">关闭</span>
          </button>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <CompactTextField label="中文标题" onChange={setTitleZh} value={titleZh} />
              <CompactTextField label="英文标题" onChange={setTitleEn} value={titleEn} />
            </div>
            <CompactTextArea label="中文摘要" onChange={setExcerptZh} rows={3} value={excerptZh} />
            <CompactTextArea label="英文摘要" onChange={setExcerptEn} rows={3} value={excerptEn} />
            <CompactTextArea label="中文正文" onChange={setBodyZh} rows={6} value={bodyZh} />
            <CompactTextArea label="英文正文" onChange={setBodyEn} rows={6} value={bodyEn} />
          </section>

          <aside className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-500">
              <p>ID：{post.id}</p>
              <p>作者：{post.content['zh-CN'].author}</p>
              <p>来源：{getPostSourceLabel(post)}</p>
              <p>发布日期：{post.publishedAt}</p>
            </div>
            <CompactTextField label="封面 URL" onChange={setCover} value={cover} />
            <CompactTextField label="阅读分钟" onChange={setReadingMinutes} type="number" value={readingMinutes} />
            <label className="block text-sm font-medium">
              分类
              <select
                className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                onChange={(event) => setCategoryId(event.target.value as PostCategoryId)}
                value={categoryId}
              >
                <option value="notes">随笔</option>
                <option value="design">设计</option>
                <option value="engineering">工程</option>
                <option value="culture">文化</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              状态
              <select
                className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                onChange={(event) => setStatus(event.target.value as PostStatus)}
                value={status}
              >
                <option value="published">已发布</option>
                <option value="review">审核中</option>
                <option value="draft">草稿</option>
              </select>
            </label>
            {message ? <p className="text-sm font-medium text-brand">{message}</p> : null}
          </aside>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-panel px-4 py-3 sm:flex-row sm:justify-between">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-coral/30 px-4 text-sm font-semibold text-coral transition hover:bg-coral/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deletePending || saving}
            onClick={handleDelete}
            type="button"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {deletePending ? '删除中...' : '删除文章'}
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || deletePending}
            type="submit"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CompactTextField({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function CompactTextArea({
  label,
  onChange,
  rows,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  rows: number;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
    </label>
  );
}

function splitBodyLines(value: string) {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines : [''];
}

function isOpenSourcePost(post: ApiPost) {
  return post.authorId === 'u_system' || post.authorId.startsWith('open-source');
}

function getPostSourceLabel(post: ApiPost) {
  return isOpenSourcePost(post) ? '开源' : '个人上传';
}

function getPostStatusLabel(status: PostStatus) {
  return {
    draft: '草稿',
    published: '已发布',
    review: '审核中',
  }[status];
}

const adminDocCategories: Array<WorkDocCategory | 'all'> = ['all', 'deployment', 'shortcut', 'workflow', 'reference'];

function DocsAdminPage({ docs }: { docs: WorkDoc[] }) {
  const [category, setCategory] = useState<WorkDocCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) => {
        const normalizedQuery = query.trim().toLowerCase();
        const text = [
          doc.id,
          doc.category,
          ...doc.tags,
          doc.content['zh-CN'].title,
          doc.content['zh-CN'].summary,
          doc.content['en-US'].title,
        ].join(' ').toLowerCase();
        const matchesQuery = normalizedQuery ? text.includes(normalizedQuery) : true;
        const matchesCategory = category === 'all' || doc.category === category;

        return matchesQuery && matchesCategory;
      }),
    [category, docs, query],
  );
  const selectedDoc = filteredDocs.find((doc) => doc.id === selectedDocId) ?? filteredDocs[0] ?? null;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <ApiSummaryItem label="文档总数" value={docs.length} />
        <ApiSummaryItem label="当前筛选" value={filteredDocs.length} />
        <ApiSummaryItem label="分类数" value={new Set(docs.map((doc) => doc.category)).size} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">笔记文档</h2>
              <p className="mt-1 text-sm text-slate-500">浏览部署流程、快捷操作和工作参考。</p>
            </div>
            <div className="grid gap-2 lg:grid-cols-[220px_140px]">
              <label className="relative min-w-0">
                <span className="sr-only">搜索文档</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-10 w-full rounded-lg border border-line pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索文档"
                  value={query}
                />
              </label>
              <select
                className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                onChange={(event) => setCategory(event.target.value as WorkDocCategory | 'all')}
                value={category}
              >
                {adminDocCategories.map((item) => (
                  <option key={item} value={item}>
                    {getAdminDocCategoryLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-line">
            {filteredDocs.length ? (
              filteredDocs.map((doc) => (
                <button
                  className={`grid w-full gap-1 border-b border-line px-3 py-2 text-left last:border-b-0 transition hover:bg-slate-50 ${
                    selectedDoc?.id === doc.id ? 'bg-slate-50' : ''
                  }`}
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  type="button"
                >
                  <span className="truncate text-sm font-semibold">{doc.content['zh-CN'].title}</span>
                  <span className="truncate text-xs text-slate-500">{doc.content['zh-CN'].summary}</span>
                  <span className="text-xs text-slate-400">
                    {getAdminDocCategoryLabel(doc.category)} · {doc.updatedAt}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">暂无匹配文档</div>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-line bg-panel p-4 shadow-panel xl:sticky xl:top-4 xl:self-start">
          {selectedDoc ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold">
                  {getAdminDocCategoryLabel(selectedDoc.category)}
                </span>
                <span>{selectedDoc.updatedAt}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold">{selectedDoc.content['zh-CN'].title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selectedDoc.content['zh-CN'].summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedDoc.tags.map((tag) => (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-line pt-4 text-sm leading-7 text-slate-700">
                {selectedDoc.content['zh-CN'].body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {selectedDoc.content['zh-CN'].sections?.length ? (
                  <div className="grid gap-2 pt-1">
                    {selectedDoc.content['zh-CN'].sections.map((section, index) => (
                      <section className="rounded-lg border border-line bg-slate-50 p-3" key={section.title}>
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
                        </div>
                        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
                          {section.items.map((item) => (
                            <li className="flex gap-2" key={item}>
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">请选择文档</div>
          )}
        </aside>
      </section>
    </section>
  );
}

function getAdminDocCategoryLabel(category: WorkDocCategory | 'all') {
  return {
    all: '全部分类',
    deployment: '部署',
    shortcut: '快捷操作',
    workflow: '工作流',
    reference: '参考',
  }[category];
}

function UsersAdminPage({
  currentUserId,
  deleteMessage,
  onDeleteUser,
  onSearch,
  search,
  setSearch,
  users,
}: {
  currentUserId: string;
  deleteMessage: string;
  onDeleteUser: (user: User) => void;
  onSearch: (event?: FormEvent<HTMLFormElement>) => void;
  search: string;
  setSearch: (value: string) => void;
  users: User[];
}) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard color="brand" icon={<UsersRound />} label="用户总数" value={users.length} />
        <MetricCard
          color="mint"
          icon={<ShieldCheck />}
          label="管理员"
          value={users.filter((user) => user.role === 'admin').length}
        />
        <MetricCard
          color="amber"
          icon={<BookOpenCheck />}
          label="作者"
          value={users.filter((user) => user.role === 'author').length}
        />
      </div>

      <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">用户管理</h2>
            <p className="mt-1 text-sm text-slate-500">查看所有注册用户，并按昵称、邮箱或角色搜索。</p>
          </div>
          <form className="flex w-full gap-2 lg:max-w-md" onSubmit={onSearch}>
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">搜索用户</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-lg border border-line pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索昵称、邮箱或角色"
                value={search}
              />
            </label>
            <button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="submit">
              搜索
            </button>
          </form>
        </div>

        {deleteMessage ? <p className="mt-4 text-sm font-medium text-brand">{deleteMessage}</p> : null}

        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          {users.length ? (
            users.map((user) => (
              <div
                className="grid gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_110px_150px]"
                key={user.id}
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.id}</p>
                </div>
                <p className="text-sm text-slate-600">{user.email}</p>
                <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {user.role}
                </span>
                {user.id === currentUserId ? (
                  <span className="text-xs font-medium text-slate-400">当前账号</span>
                ) : (
                  <button
                    className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg border border-coral/30 px-3 text-xs font-semibold text-coral transition hover:bg-coral/10"
                    onClick={() => onDeleteUser(user)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    删除
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-sm text-slate-500">暂无匹配用户</div>
          )}
        </div>
      </section>
    </section>
  );
}

function MusicAdminPage({
  createMessage,
  music,
  musicAlbum,
  musicArtist,
  musicCover,
  musicFile,
  musicTitle,
  musicUrl,
  onCreateMusic,
  setMusicAlbum,
  setMusicArtist,
  setMusicCover,
  setMusicFile,
  setMusicTitle,
  setMusicUrl,
}: {
  createMessage: string;
  music: FavoriteMusic[];
  musicAlbum: string;
  musicArtist: string;
  musicCover: string;
  musicFile: File | null;
  musicTitle: string;
  musicUrl: string;
  onCreateMusic: (event: FormEvent<HTMLFormElement>) => void;
  setMusicAlbum: (value: string) => void;
  setMusicArtist: (value: string) => void;
  setMusicCover: (value: string) => void;
  setMusicFile: (value: File | null) => void;
  setMusicTitle: (value: string) => void;
  setMusicUrl: (value: string) => void;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
        <h2 className="text-lg font-semibold">音乐列表</h2>
        <div className="mt-5 grid gap-3">
          {music.map((track) => (
            <article className="rounded-lg border border-line p-4" key={track.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{track.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{track.artist}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {track.source}
                </span>
              </div>
              {track.audioUrl ? (
                <audio className="mt-3 w-full" controls preload="none" src={resolveMediaUrl(track.audioUrl)} />
              ) : (
                <p className="mt-3 text-sm text-slate-500">暂无可播放音频，仅保存来源链接。</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <form className="rounded-lg border border-line bg-panel p-5 shadow-panel" onSubmit={onCreateMusic}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-coral text-white">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">上传音乐</h2>
            <p className="text-xs text-slate-500">选择文件或填写外部音频链接。</p>
          </div>
        </div>
        <TextField label="歌曲名" onChange={setMusicTitle} value={musicTitle} />
        <TextField label="歌手" onChange={setMusicArtist} value={musicArtist} />
        <TextField label="专辑" onChange={setMusicAlbum} value={musicAlbum} />
        <TextField label="封面 URL" onChange={setMusicCover} value={musicCover} />
        <TextField label="外部音频 URL" onChange={setMusicUrl} value={musicUrl} />
        <label className="mt-4 block text-sm font-medium">
          上传文件
          <input
            accept="audio/*"
            className="mt-2 block w-full rounded-lg border border-line px-3 py-2 text-sm"
            onChange={(event) => setMusicFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
        {musicFile ? <p className="mt-2 text-xs text-slate-500">已选择：{musicFile.name}</p> : null}
        {createMessage ? <p className="mt-3 text-sm text-mint">{createMessage}</p> : null}
        <button className="mt-5 h-11 w-full rounded-lg bg-coral px-4 text-sm font-semibold text-white" type="submit">
          保存音乐
        </button>
      </form>
    </section>
  );
}

const apiAudienceSections: Array<{ audience: ApiAudience; body: string; title: string }> = [
  {
    audience: 'web',
    body: '前台页面、注册登录、文章、音乐播放与投稿会使用这些接口。',
    title: 'Web 端接口',
  },
  {
    audience: 'admin',
    body: '管理后台登录后使用这些接口，包含内容、用户、音乐和接口配置。',
    title: 'Admin 端接口',
  },
];

function ApiConfigPage({ endpoints }: { endpoints: ApiEndpointInfo[] }) {
  const webCount = useMemo(
    () => endpoints.filter((endpoint) => endpoint.audiences.includes('web')).length,
    [endpoints],
  );
  const adminCount = useMemo(
    () => endpoints.filter((endpoint) => endpoint.audiences.includes('admin')).length,
    [endpoints],
  );
  const sharedCount = useMemo(
    () => endpoints.filter((endpoint) => endpoint.audiences.length > 1).length,
    [endpoints],
  );
  const endpointReferenceCount = webCount + adminCount;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">接口配置详情</h2>
            <p className="mt-1 text-sm text-slate-500">
              唯一接口按真实路径去重；Web/Admin 数量是端侧引用数，共用接口会在两边各出现一次。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[34rem]">
            <ApiSummaryItem label="唯一接口" value={endpoints.length} />
            <ApiSummaryItem label="端侧引用" value={endpointReferenceCount} />
            <ApiSummaryItem label="Web" value={webCount} />
            <ApiSummaryItem label="Admin" value={adminCount} />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          当前有 {sharedCount} 个共用接口，所以 Web {webCount} + Admin {adminCount} = {endpointReferenceCount}，唯一接口数为 {endpoints.length}。
        </p>
      </div>

      {apiAudienceSections.map((section) => (
        <ApiEndpointSection
          endpoints={endpoints.filter((endpoint) => endpoint.audiences.includes(section.audience))}
          key={section.audience}
          {...section}
        />
      ))}
    </section>
  );
}

function ApiSummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function ApiEndpointSection({
  audience,
  body,
  endpoints,
  title,
}: {
  audience: ApiAudience;
  body: string;
  endpoints: ApiEndpointInfo[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{audience}</p>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{body}</p>
        </div>
        <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
          {endpoints.length} 个接口
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line">
        {endpoints.map((endpoint) => (
          <article
            className="grid gap-2 border-b border-line px-3 py-2.5 last:border-b-0 xl:grid-cols-[88px_minmax(0,1.15fr)_120px_120px_minmax(0,1.4fr)] xl:items-center"
            key={`${audience}-${endpoint.id}`}
          >
            <span className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${getMethodClass(endpoint.method)}`}>
              {endpoint.method}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{endpoint.title}</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-500">{endpoint.path}</p>
            </div>
            <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {endpoint.module}
            </span>
            <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {getAuthLabel(endpoint.auth)}
            </span>
            <p className="text-sm leading-6 text-slate-500">{endpoint.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function getAuthLabel(auth: ApiEndpointInfo['auth']) {
  return {
    admin: 'admin token',
    public: 'public',
    user: 'user token',
  }[auth];
}

function getMethodClass(method: ApiEndpointInfo['method']) {
  return {
    DELETE: 'bg-coral/10 text-coral',
    GET: 'bg-mint/10 text-mint',
    PATCH: 'bg-amber/10 text-amber',
    POST: 'bg-brand/10 text-brand',
    PUT: 'bg-amber/10 text-amber',
  }[method];
}

function PlaceholderPage({ body, title }: { body: string; title: string }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-6 shadow-panel">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{body}</p>
    </section>
  );
}

function TextField({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="mt-4 block text-sm font-medium">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-lg border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="mt-4 block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full resize-none rounded-lg border border-line px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function StatusBadge({ state }: { state: LoadState }) {
  const label = {
    idle: '未连接',
    loading: '连接中',
    ready: '后端在线',
    error: '后端未启动',
  }[state];

  const color = state === 'ready' ? 'bg-mint' : state === 'error' ? 'bg-coral' : 'bg-amber';

  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function MetricCard({
  color,
  icon,
  label,
  value,
}: {
  color: 'brand' | 'mint' | 'coral' | 'amber';
  icon: ReactNode;
  label: string;
  value: number;
}) {
  const colorClass = {
    brand: 'bg-brand',
    mint: 'bg-mint',
    coral: 'bg-coral',
    amber: 'bg-amber',
  }[color];

  return (
    <article className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <span className={`grid h-10 w-10 place-items-center rounded-lg text-white ${colorClass}`}>{icon}</span>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </article>
  );
}

function ModuleHint({ body, icon, title }: { body: string; icon: ReactNode; title: string }) {
  return (
    <article className="rounded-lg border border-line p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-brand">{icon}</span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </article>
  );
}

function createCaptcha() {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 2;

  return {
    answer: String(left + right),
    question: `${left} + ${right}`,
  };
}

function readStoredAuth(): AuthLoginResponse | null {
  const stored = window.localStorage.getItem(adminAuthStorageKey);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthLoginResponse;
  } catch {
    window.localStorage.removeItem(adminAuthStorageKey);
    return null;
  }
}

function resolveMediaUrl(path: string) {
  if (path.startsWith('http')) {
    return path;
  }

  return `http://localhost:4000${path}`;
}

export default App;
