import {
  BookOpenCheck,
  Gauge,
  Headphones,
  Link as LinkIcon,
  LogIn,
  LogOut,
  Megaphone,
  Music2,
  Newspaper,
  RadioTower,
  RefreshCw,
  Share2,
  ShieldCheck,
  Upload,
  UsersRound,
} from 'lucide-react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type {
  ApiPost,
  AuthLoginResponse,
  CreateMusicBody,
  CreatePostBody,
  FavoriteMusic,
  PostCategoryId,
  PostStatus,
} from '@blog/shared';
import { adminApi } from './api';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const adminAuthStorageKey = 'blog-admin-auth';

const modules = [
  { label: '总览', path: '/', Icon: Gauge },
  { label: '文章管理', path: '/articles', Icon: Newspaper },
  { label: '音乐管理', path: '/music', Icon: Headphones },
  { label: '用户管理', path: '/users', Icon: UsersRound },
  { label: '知识源', path: '/knowledge', Icon: RadioTower },
  { label: '分享配置', path: '/sharing', Icon: Share2 },
];

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AdminAuthGate />
    </BrowserRouter>
  );
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
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [music, setMusic] = useState<FavoriteMusic[]>([]);

  const [postTitleZh, setPostTitleZh] = useState('后台发布的新文章');
  const [postTitleEn, setPostTitleEn] = useState('A new post from admin');
  const [postExcerptZh, setPostExcerptZh] = useState('这篇文章来自管理后台，发布后会出现在前台文章列表。');
  const [postExcerptEn, setPostExcerptEn] = useState(
    'This post comes from the admin app and appears on the public site after publishing.',
  );
  const [postCategoryId, setPostCategoryId] = useState<PostCategoryId>('notes');
  const [postStatus, setPostStatus] = useState<PostStatus>('published');
  const [createPostMessage, setCreatePostMessage] = useState('');

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
      const [health, postList, musicList] = await Promise.all([
        adminApi.health(),
        adminApi.posts(),
        adminApi.favoriteMusic(),
      ]);
      setPosts(postList);
      setMusic(musicList);
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

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatePostMessage('');

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
                  createMessage={createPostMessage}
                  onCreatePost={handleCreatePost}
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
            <Route element={<PlaceholderPage title="用户管理" body="后续接入用户角色、禁用、密码重置和作者权限。" />} path="/users" />
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
  createMessage,
  onCreatePost,
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
  createMessage: string;
  onCreatePost: (event: FormEvent<HTMLFormElement>) => void;
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
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
        <h2 className="text-lg font-semibold">文章列表</h2>
        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          {posts.map((post) => (
            <div
              className="grid gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_120px_100px]"
              key={post.id}
            >
              <div>
                <p className="font-medium">{post.content['zh-CN'].title}</p>
                <p className="mt-1 truncate text-sm text-slate-500">{post.content['zh-CN'].excerpt}</p>
              </div>
              <span className="text-sm text-slate-500">{post.publishedAt}</span>
              <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {post.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <form className="rounded-lg border border-line bg-panel p-5 shadow-panel" onSubmit={onCreatePost}>
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
