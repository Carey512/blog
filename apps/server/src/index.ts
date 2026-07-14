import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  ApiPost,
  ApiEndpointInfo,
  AuthLoginBody,
  AuthLoginResponse,
  AuthRegisterBody,
  Category,
  CreateMusicBody,
  CreatePostBody,
  FavoriteMusic,
  Locale,
  PostStatus,
  UpdatePostBody,
  User,
  WorkDoc,
  WorkDocCategory,
} from '@blog/shared';

const server = Fastify({
  logger: true,
});

const uploadRoot = join(process.cwd(), 'uploads');
const musicUploadDir = join(uploadRoot, 'music');
const moduleDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = join(moduleDir, '..', 'data');
const aboutCardsStorePath = join(dataRoot, 'about-cards.json');
const categoriesStorePath = join(dataRoot, 'categories.json');
const docsStorePath = join(dataRoot, 'docs.json');
const musicStorePath = join(dataRoot, 'music.json');
const postsStorePath = join(dataRoot, 'posts.json');
const usersStorePath = join(dataRoot, 'users.json');

type UserAccount = User & {
  createdAt: string;
  passwordHash: string;
};

const endpointCatalog: ApiEndpointInfo[] = [
  {
    auth: 'public',
    audiences: ['admin'],
    description: '检查后端服务是否在线，供管理后台状态栏使用。',
    id: 'health',
    method: 'GET',
    module: 'system',
    path: '/health',
    title: '服务健康检查',
  },
  {
    auth: 'public',
    audiences: ['web', 'admin'],
    description: '邮箱密码登录，返回 token 和当前用户信息。',
    id: 'auth-login',
    method: 'POST',
    module: 'auth',
    path: '/api/auth/login',
    title: '登录',
  },
  {
    auth: 'public',
    audiences: ['web'],
    description: '前台注册作者账号，注册成功后直接返回 token。',
    id: 'auth-register',
    method: 'POST',
    module: 'auth',
    path: '/api/auth/register',
    title: '注册',
  },
  {
    auth: 'user',
    audiences: ['web'],
    description: '根据 token 获取当前登录用户。',
    id: 'user-me',
    method: 'GET',
    module: 'users',
    path: '/api/users/me',
    title: '当前用户',
  },
  {
    auth: 'admin',
    audiences: ['admin'],
    description: '管理后台获取用户列表，支持 q 搜索昵称、邮箱或角色。',
    id: 'users-list',
    method: 'GET',
    module: 'users',
    path: '/api/users?q=keyword',
    title: '用户列表',
  },
  {
    auth: 'admin',
    audiences: ['admin'],
    description: '管理后台删除指定用户，禁止删除当前登录账号。',
    id: 'users-delete',
    method: 'DELETE',
    module: 'users',
    path: '/api/users/:userId',
    title: '删除用户',
  },
  {
    auth: 'admin',
    audiences: ['admin'],
    description: '管理后台读取接口配置详情，用于展示 Web/Admin 端接口清单。',
    id: 'meta-endpoints',
    method: 'GET',
    module: 'system',
    path: '/api/meta/endpoints',
    title: '接口配置详情',
  },
  {
    auth: 'public',
    audiences: ['web'],
    description: '前台读取文章分类和多语言分类名称。',
    id: 'categories-list',
    method: 'GET',
    module: 'categories',
    path: '/api/categories',
    title: '文章分类',
  },
  {
    auth: 'public',
    audiences: ['web'],
    description: '前台 About 页面卡片内容。',
    id: 'about-cards',
    method: 'GET',
    module: 'site',
    path: '/api/about/cards',
    title: '关于页卡片',
  },
  {
    auth: 'public',
    audiences: ['web', 'admin'],
    description: '读取笔记文档列表，支持 q 搜索标题、摘要、标签和分类。',
    id: 'docs-list',
    method: 'GET',
    module: 'docs',
    path: '/api/docs?q=keyword',
    title: '笔记文档列表',
  },
  {
    auth: 'public',
    audiences: ['web', 'admin'],
    description: '按文档 ID 读取笔记文档详情。',
    id: 'docs-detail',
    method: 'GET',
    module: 'docs',
    path: '/api/docs/:docId',
    title: '笔记文档详情',
  },
  {
    auth: 'public',
    audiences: ['web', 'admin'],
    description: '读取文章列表，前台使用 published，后台用于管理总览。',
    id: 'posts-list',
    method: 'GET',
    module: 'posts',
    path: '/api/posts?status=published',
    title: '文章列表',
  },
  {
    auth: 'public',
    audiences: ['web'],
    description: '前台文章详情页按文章 ID 读取内容。',
    id: 'posts-detail',
    method: 'GET',
    module: 'posts',
    path: '/api/posts/:postId',
    title: '文章详情',
  },
  {
    auth: 'user',
    audiences: ['web', 'admin'],
    description: '登录用户提交文章，默认进入 review 审核状态。',
    id: 'posts-create',
    method: 'POST',
    module: 'posts',
    path: '/api/posts',
    title: '创建文章',
  },
  {
    auth: 'admin',
    audiences: ['admin'],
    description: '管理后台更新文章标题、摘要、正文、分类、状态和封面。',
    id: 'posts-update',
    method: 'PUT',
    module: 'posts',
    path: '/api/posts/:postId',
    title: '更新文章',
  },
  {
    auth: 'admin',
    audiences: ['admin'],
    description: '管理后台删除指定文章，删除后前台列表不再展示。',
    id: 'posts-delete',
    method: 'DELETE',
    module: 'posts',
    path: '/api/posts/:postId',
    title: '删除文章',
  },
  {
    auth: 'public',
    audiences: ['web', 'admin'],
    description: '读取音乐列表，支持 q 搜索标题、歌手、专辑或平台。',
    id: 'music-list',
    method: 'GET',
    module: 'music',
    path: '/api/music?q=keyword',
    title: '音乐列表',
  },
  {
    auth: 'public',
    audiences: ['web'],
    description: '读取收藏音乐列表，兼容前台收藏音乐入口。',
    id: 'music-favorites',
    method: 'GET',
    module: 'music',
    path: '/api/music/favorites',
    title: '收藏音乐',
  },
  {
    auth: 'user',
    audiences: ['admin'],
    description: '管理后台新增外部音乐链接。',
    id: 'music-create',
    method: 'POST',
    module: 'music',
    path: '/api/music',
    title: '新增音乐',
  },
  {
    auth: 'user',
    audiences: ['admin'],
    description: '管理后台上传本地音频文件并生成可播放地址。',
    id: 'music-upload',
    method: 'POST',
    module: 'music',
    path: '/api/music/upload',
    title: '上传音乐',
  },
];

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(account: UserAccount): User {
  return {
    email: account.email,
    id: account.id,
    name: account.name,
    role: account.role,
  };
}

function getAuthenticatedUser(request: FastifyRequest): User | undefined {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token.startsWith('demo-token-')) {
    return undefined;
  }

  const userId = token.slice('demo-token-'.length);
  const account = userAccounts.find((user) => user.id === userId);
  return account ? toPublicUser(account) : undefined;
}

function requireAuthenticatedUser(request: FastifyRequest, reply: FastifyReply): User | undefined {
  const user = getAuthenticatedUser(request);

  if (!user) {
    reply.code(401).send({
      message: 'Authentication token is required',
    });
    return undefined;
  }

  return user;
}

type AboutCard = {
  body: Record<Locale, string>;
  icon: 'database' | 'layers' | 'palette';
  id: string;
  title: Record<Locale, string>;
};

type DemoAudioSpec = {
  bpm: number;
  fileName: string;
  gain: number;
  harmonic: number;
  notes: number[];
};

const demoAudioSpecs: DemoAudioSpec[] = [
  { bpm: 82, fileName: 'demo-nanfang-laixin.wav', gain: 0.34, harmonic: 0.18, notes: [261.63, 329.63, 392, 440, 392, 329.63, 293.66, 349.23] },
  { bpm: 96, fileName: 'demo-wanfengli.wav', gain: 0.3, harmonic: 0.24, notes: [220, 277.18, 329.63, 369.99, 415.3, 369.99, 329.63, 277.18] },
  { bpm: 74, fileName: 'demo-wugang.wav', gain: 0.36, harmonic: 0.12, notes: [196, 246.94, 293.66, 349.23, 392, 349.23, 293.66, 246.94] },
  { bpm: 110, fileName: 'demo-qingchen-bashi.wav', gain: 0.28, harmonic: 0.2, notes: [293.66, 349.23, 440, 523.25, 493.88, 440, 349.23, 293.66] },
  { bpm: 68, fileName: 'demo-yueguang-wuding.wav', gain: 0.32, harmonic: 0.28, notes: [174.61, 220, 261.63, 329.63, 392, 329.63, 261.63, 220] },
  { bpm: 104, fileName: 'demo-jiujiekou.wav', gain: 0.31, harmonic: 0.16, notes: [246.94, 311.13, 369.99, 466.16, 415.3, 369.99, 311.13, 246.94] },
  { bpm: 88, fileName: 'demo-haibian-bianlidian.wav', gain: 0.33, harmonic: 0.22, notes: [233.08, 293.66, 349.23, 440, 523.25, 440, 349.23, 293.66] },
  { bpm: 78, fileName: 'demo-xinghe-manman.wav', gain: 0.29, harmonic: 0.3, notes: [207.65, 261.63, 329.63, 415.3, 493.88, 415.3, 329.63, 261.63] },
  { bpm: 92, fileName: 'demo-yuxiang.wav', gain: 0.3, harmonic: 0.2, notes: [261.63, 293.66, 349.23, 392, 466.16, 392, 349.23, 293.66] },
  { bpm: 86, fileName: 'demo-jiangnan-wuhou.wav', gain: 0.31, harmonic: 0.18, notes: [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63] },
  { bpm: 100, fileName: 'demo-blog-radio.wav', gain: 0.27, harmonic: 0.26, notes: [185, 233.08, 277.18, 369.99, 440, 369.99, 277.18, 233.08] },
];

function createDemoWav(spec: DemoAudioSpec) {
  const sampleRate = 22050;
  const seconds = 14;
  const channels = 1;
  const bytesPerSample = 2;
  const samples = sampleRate * seconds;
  const dataSize = samples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  const beatLength = 60 / spec.bpm;

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples; index += 1) {
    const time = index / sampleRate;
    const beatIndex = Math.floor(time / beatLength);
    const localBeatTime = time - beatIndex * beatLength;
    const frequency = spec.notes[beatIndex % spec.notes.length];
    const harmony = spec.notes[(beatIndex + 2) % spec.notes.length] / 2;
    const fade = Math.max(
      0,
      Math.min(1, localBeatTime / 0.04, (beatLength - localBeatTime) / 0.1),
    );
    const pulse = localBeatTime < 0.05
      ? Math.sin(2 * Math.PI * 88 * localBeatTime) * (1 - localBeatTime / 0.05) * 0.12
      : 0;
    const wave =
      Math.sin(2 * Math.PI * frequency * time) +
      Math.sin(2 * Math.PI * frequency * 2 * time) * spec.harmonic +
      Math.sin(2 * Math.PI * harmony * time) * 0.32 +
      pulse;
    const sample = Math.max(-1, Math.min(1, wave * spec.gain * fade));

    buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }

  return buffer;
}

async function ensureDemoAudioFiles() {
  await Promise.all(
    demoAudioSpecs.map((spec) =>
      writeFile(join(musicUploadDir, spec.fileName), createDemoWav(spec)),
    ),
  );
}

let aboutCards: AboutCard[] = [];
let categories: Category[] = [];
let docs: WorkDoc[] = [];
let favoriteMusic: FavoriteMusic[] = [];
let posts: ApiPost[] = [];
let userAccounts: UserAccount[] = [];

async function loadAboutCards() {
  await mkdir(dataRoot, { recursive: true });

  try {
    const content = await readFile(aboutCardsStorePath, 'utf8');
    aboutCards = JSON.parse(content) as AboutCard[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    aboutCards = [];
    await saveAboutCards();
  }
}

async function saveAboutCards() {
  await writeFile(aboutCardsStorePath, `${JSON.stringify(aboutCards, null, 2)}\n`, 'utf8');
}

async function loadCategories() {
  await mkdir(dataRoot, { recursive: true });

  try {
    const content = await readFile(categoriesStorePath, 'utf8');
    categories = JSON.parse(content) as Category[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    categories = [];
    await saveCategories();
  }
}

async function saveCategories() {
  await writeFile(categoriesStorePath, `${JSON.stringify(categories, null, 2)}\n`, 'utf8');
}

async function loadDocs() {
  await mkdir(dataRoot, { recursive: true });

  try {
    const content = await readFile(docsStorePath, 'utf8');
    docs = JSON.parse(content) as WorkDoc[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    docs = [];
    await saveDocs();
  }
}

async function saveDocs() {
  await writeFile(docsStorePath, `${JSON.stringify(docs, null, 2)}\n`, 'utf8');
}


async function loadPosts() {
  await mkdir(dataRoot, { recursive: true });

  try {
    const content = await readFile(postsStorePath, 'utf8');
    posts = JSON.parse(content) as ApiPost[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    posts = [];
    await savePosts();
  }
}

async function savePosts() {
  await writeFile(postsStorePath, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
}

async function loadMusic() {
  await mkdir(dataRoot, { recursive: true });

  try {
    const content = await readFile(musicStorePath, 'utf8');
    favoriteMusic = JSON.parse(content) as FavoriteMusic[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    favoriteMusic = [];
    await saveMusic();
  }
}

async function saveMusic() {
  await writeFile(musicStorePath, `${JSON.stringify(favoriteMusic, null, 2)}\n`, 'utf8');
}

async function loadUsers() {
  await mkdir(dataRoot, { recursive: true });

  try {
    const content = await readFile(usersStorePath, 'utf8');
    userAccounts = JSON.parse(content) as UserAccount[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    userAccounts = [
      {
        createdAt: '2026-07-12T00:00:00.000Z',
        email: 'admin@example.com',
        id: 'u_admin',
        name: 'Admin',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
      },
      {
        createdAt: '2026-07-12T00:00:00.000Z',
        email: 'author@example.com',
        id: 'u_author',
        name: 'Author',
        passwordHash: hashPassword('author123'),
        role: 'author',
      },
    ];
    await saveUsers();
  }
}

async function saveUsers() {
  await writeFile(usersStorePath, `${JSON.stringify(userAccounts, null, 2)}\n`, 'utf8');
}

await server.register(cors, {
  origin: true,
});

await mkdir(musicUploadDir, { recursive: true });
await ensureDemoAudioFiles();
await loadAboutCards();
await loadCategories();
await loadDocs();
await loadMusic();
await loadPosts();
await loadUsers();

await server.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
});

await server.register(fastifyStatic, {
  prefix: '/uploads/',
  root: uploadRoot,
});

server.get('/health', async () => ({
  ok: true,
  service: '@blog/server',
  time: new Date().toISOString(),
}));

server.post<{ Body: AuthLoginBody }>('/api/auth/login', async (request, reply): Promise<AuthLoginResponse> => {
  const email = normalizeEmail(request.body.email);
  const account = userAccounts.find((item) => item.email === email);
  const validPassword = account?.passwordHash === hashPassword(request.body.password);

  if (!account || !validPassword) {
    return reply.code(401).send({
      message: 'Invalid email or password',
    } as never);
  }

  return {
    token: `demo-token-${account.id}`,
    user: toPublicUser(account),
  };
});

server.post<{ Body: AuthRegisterBody }>('/api/auth/register', async (request, reply): Promise<AuthLoginResponse> => {
  const email = normalizeEmail(request.body.email);
  const name = request.body.name.trim();
  const password = request.body.password.trim();

  if (!email || !name || password.length < 6) {
    return reply.code(400).send({
      message: 'name, valid email and password with at least 6 characters are required',
    } as never);
  }

  if (userAccounts.some((account) => account.email === email)) {
    return reply.code(409).send({
      message: 'Email already exists',
    } as never);
  }

  const now = new Date().toISOString();
  const account: UserAccount = {
    createdAt: now,
    email,
    id: `u_${Date.now()}`,
    name,
    passwordHash: hashPassword(password),
    role: 'author',
  };

  userAccounts.unshift(account);
  await saveUsers();

  reply.code(201);
  return {
    token: `demo-token-${account.id}`,
    user: toPublicUser(account),
  };
});

server.get('/api/users/me', async (request, reply): Promise<User> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  return user;
});

server.get<{ Querystring: { q?: string } }>('/api/users', async (request, reply): Promise<User[]> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    } as never);
  }

  const query = request.query.q?.trim().toLowerCase();
  const accounts = query
    ? userAccounts.filter((account) =>
        [account.name, account.email, account.role]
          .some((value) => value.toLowerCase().includes(query)),
      )
    : userAccounts;

  return accounts.map(toPublicUser);
});

server.delete<{ Params: { userId: string } }>('/api/users/:userId', async (request, reply) => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    });
  }

  if (request.params.userId === user.id) {
    return reply.code(400).send({
      message: 'You cannot delete the current admin account',
    });
  }

  const target = userAccounts.find((account) => account.id === request.params.userId);

  if (!target) {
    return reply.code(404).send({
      message: 'User not found',
    });
  }

  if (target.role === 'admin' && userAccounts.filter((account) => account.role === 'admin').length <= 1) {
    return reply.code(400).send({
      message: 'At least one admin account is required',
    });
  }

  userAccounts = userAccounts.filter((account) => account.id !== target.id);
  await saveUsers();

  return {
    deletedUser: toPublicUser(target),
    ok: true,
  };
});

server.get('/api/meta/endpoints', async (request, reply): Promise<ApiEndpointInfo[]> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    } as never);
  }

  return endpointCatalog;
});

server.get('/api/categories', async (): Promise<Category[]> => categories);

server.get('/api/about/cards', async (): Promise<AboutCard[]> => aboutCards);

server.get<{ Querystring: { category?: WorkDocCategory | 'all'; q?: string } }>('/api/docs', async (request): Promise<WorkDoc[]> => {
  const query = request.query.q?.trim().toLowerCase();
  const category = request.query.category;

  return docs.filter((doc) => {
    const matchesCategory = !category || category === 'all' || doc.category === category;
    const matchesQuery = query
      ? [
          doc.id,
          doc.category,
          ...doc.tags,
          doc.content['zh-CN'].title,
          doc.content['zh-CN'].summary,
          doc.content['en-US'].title,
          doc.content['en-US'].summary,
        ].some((value) => value.toLowerCase().includes(query))
      : true;

    return matchesCategory && matchesQuery;
  });
});

server.get<{ Params: { docId: string } }>('/api/docs/:docId', async (request, reply): Promise<WorkDoc> => {
  const doc = docs.find((item) => item.id === request.params.docId);

  if (!doc) {
    return reply.code(404).send({
      message: 'Document not found',
    } as never);
  }

  return doc;
});

server.get<{ Querystring: { status?: PostStatus } }>('/api/posts', async (request): Promise<ApiPost[]> => {
  if (!request.query.status) {
    return posts;
  }

  return posts.filter((post) => post.status === request.query.status);
});

server.get<{ Params: { postId: string } }>('/api/posts/:postId', async (request, reply) => {
  const post = posts.find((item) => item.id === request.params.postId);

  if (!post) {
    return reply.code(404).send({
      message: 'Post not found',
    });
  }

  return post;
});

server.post<{ Body: CreatePostBody }>('/api/posts', async (request, reply): Promise<ApiPost> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  const now = new Date();
  const fallbackTitle = request.body.content['en-US'].title || request.body.content['zh-CN'].title;
  const idBase = fallbackTitle
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  const post: ApiPost = {
    id: `${idBase || 'post'}-${now.getTime()}`,
    authorId: user.id,
    categoryId: request.body.categoryId,
    content: request.body.content,
    cover:
      request.body.cover ||
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=85',
    date: now.toISOString().slice(0, 10),
    featured: request.body.featured ?? false,
    publishedAt: now.toISOString().slice(0, 10),
    readingMinutes: request.body.readingMinutes ?? 5,
    status: request.body.status,
  };

  posts.unshift(post);
  await savePosts();

  reply.code(201);
  return post;
});

server.put<{ Body: UpdatePostBody; Params: { postId: string } }>(
  '/api/posts/:postId',
  async (request, reply): Promise<ApiPost> => {
    const user = requireAuthenticatedUser(request, reply);

    if (!user) {
      return undefined as never;
    }

    if (user.role !== 'admin') {
      return reply.code(403).send({
        message: 'Admin role is required',
      } as never);
    }

    const index = posts.findIndex((post) => post.id === request.params.postId);

    if (index < 0) {
      return reply.code(404).send({
        message: 'Post not found',
      } as never);
    }

    const previous = posts[index];
    const today = new Date().toISOString().slice(0, 10);
    const nextPublishedAt =
      request.body.status === 'published' && previous.status !== 'published'
        ? today
        : previous.publishedAt;

    const updated: ApiPost = {
      ...previous,
      categoryId: request.body.categoryId,
      content: request.body.content,
      cover:
        request.body.cover ||
        previous.cover ||
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=85',
      date: nextPublishedAt,
      featured: request.body.featured ?? previous.featured ?? false,
      publishedAt: nextPublishedAt,
      readingMinutes: request.body.readingMinutes ?? previous.readingMinutes,
      status: request.body.status,
    };

    posts[index] = updated;
    await savePosts();

    return updated;
  },
);

server.delete<{ Params: { postId: string } }>('/api/posts/:postId', async (request, reply) => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    });
  }

  const target = posts.find((post) => post.id === request.params.postId);

  if (!target) {
    return reply.code(404).send({
      message: 'Post not found',
    });
  }

  posts = posts.filter((post) => post.id !== target.id);
  await savePosts();

  return {
    deletedPost: target,
    ok: true,
  };
});

server.get<{ Querystring: { q?: string } }>('/api/music', async (request): Promise<FavoriteMusic[]> => {
  const query = request.query.q?.trim().toLowerCase();

  if (!query) {
    return favoriteMusic;
  }

  return favoriteMusic.filter((track) =>
    [track.title, track.artist, track.album, track.platform]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query)),
  );
});

server.get('/api/music/favorites', async (): Promise<FavoriteMusic[]> => favoriteMusic);

server.post<{ Body: CreateMusicBody }>('/api/music', async (request, reply): Promise<FavoriteMusic> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  const now = new Date().toISOString();
  const track: FavoriteMusic = {
    id: `music-${Date.now()}`,
    artist: request.body.artist,
    audioUrl: request.body.audioUrl,
    album: request.body.album,
    cover: request.body.cover,
    createdAt: now,
    platform: request.body.platform,
    source: request.body.audioUrl ? 'external' : 'external',
    title: request.body.title,
    url: request.body.url,
  };

  favoriteMusic.unshift(track);
  await saveMusic();
  reply.code(201);
  return track;
});

server.post('/api/music/upload', async (request, reply): Promise<FavoriteMusic> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  const fields: Record<string, string> = {};
  let uploadedAudioUrl = '';

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      const extension = extname(part.filename || '.mp3') || '.mp3';
      const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
      const destination = join(musicUploadDir, filename);

      await pipeline(part.file, createWriteStream(destination));
      uploadedAudioUrl = `/uploads/music/${filename}`;
    } else {
      fields[part.fieldname] = String(part.value ?? '');
    }
  }

  if (!fields.title || !fields.artist || !uploadedAudioUrl) {
    return reply.code(400).send({
      message: 'title, artist and music file are required',
    } as never);
  }

  const track: FavoriteMusic = {
    id: `music-${Date.now()}`,
    album: fields.album || undefined,
    artist: fields.artist,
    audioUrl: uploadedAudioUrl,
    cover: fields.cover || undefined,
    createdAt: new Date().toISOString(),
    platform: 'Local Upload',
    source: 'upload',
    title: fields.title,
    url: uploadedAudioUrl,
  };

  favoriteMusic.unshift(track);
  await saveMusic();
  reply.code(201);
  return track;
});

const port = Number(process.env.PORT ?? 4000);

try {
  await server.listen({ host: '0.0.0.0', port });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
