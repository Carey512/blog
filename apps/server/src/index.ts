import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  AdminOverviewItem,
  ApiPost,
  ApiEndpointInfo,
  AuthLoginBody,
  AuthLoginResponse,
  AuthRegisterBody,
  Category,
  CreateMusicBody,
  CreatePostBody,
  CreateWorkDocBody,
  FavoriteMusic,
  Locale,
  MusicCategory,
  MusicCategoryId,
  PostStatus,
  UpdatePostBody,
  UpdateWorkDocBody,
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
const docsHtmlRoot = join(dataRoot, 'docs-html');
const docsStorePath = join(dataRoot, 'docs.json');
const musicStorePath = join(dataRoot, 'music.json');
const postsStorePath = join(dataRoot, 'uploaded-posts.json');
const usersStorePath = join(dataRoot, 'users.json');
const authTokenPrefix = 'blog-token-';

type UserAccount = User & {
  createdAt: string;
  passwordHash: string;
};

const endpointCatalog: ApiEndpointInfo[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    title: '服务健康检查',
    description: '检查后端服务是否在线。',
    module: 'system',
    auth: 'public',
    audiences: ['admin'],
  },
  {
    id: 'auth-login',
    method: 'POST',
    path: '/api/auth/login',
    title: '登录',
    description: '邮箱密码登录，返回 token 和当前用户信息。',
    module: 'auth',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'auth-register',
    method: 'POST',
    path: '/api/auth/register',
    title: '注册',
    description: '前台注册作者账号，注册成功后返回 token。',
    module: 'auth',
    auth: 'public',
    audiences: ['web'],
  },
  {
    id: 'user-me',
    method: 'GET',
    path: '/api/users/me',
    title: '当前用户',
    description: '根据 token 获取当前登录用户。',
    module: 'users',
    auth: 'user',
    audiences: ['web'],
  },
  {
    id: 'users-list',
    method: 'GET',
    path: '/api/users?q=keyword',
    title: '用户列表',
    description: '管理员获取用户列表，支持按昵称、邮箱或角色搜索。',
    module: 'users',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'users-delete',
    method: 'DELETE',
    path: '/api/users/:userId',
    title: '删除用户',
    description: '管理员删除指定用户。',
    module: 'users',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'meta-endpoints',
    method: 'GET',
    path: '/api/meta/endpoints',
    title: '接口配置详情',
    description: '管理员查看 Web/Admin 接口清单。',
    module: 'system',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'categories-list',
    method: 'GET',
    path: '/api/categories',
    title: '文章分类',
    description: '读取文章分类和多语言分类名称。',
    module: 'categories',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'about-cards',
    method: 'GET',
    path: '/api/about/cards',
    title: '关于页卡片',
    description: '前台 About 页面卡片内容。',
    module: 'site',
    auth: 'public',
    audiences: ['web'],
  },
  {
    id: 'docs-list',
    method: 'GET',
    path: '/api/docs?q=keyword',
    title: '笔记文档列表',
    description: '读取笔记文档列表，支持 q 搜索和分类过滤。',
    module: 'docs',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'docs-detail',
    method: 'GET',
    path: '/api/docs/:docId',
    title: '笔记文档详情',
    description: '按文档 ID 读取笔记文档详情。',
    module: 'docs',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'docs-create',
    method: 'POST',
    path: '/api/docs',
    title: '新增笔记文档',
    description: '登录用户提交文档，支持 HTML 文件或文本内容，接口自动保存 docs.json 和独立 HTML 文件。',
    module: 'docs',
    auth: 'user',
    audiences: ['web', 'admin'],
  },
  {
    id: 'docs-update',
    method: 'PUT',
    path: '/api/docs/:docId',
    title: '编辑笔记文档',
    description: '管理员编辑文档元数据、文本内容或重新上传 HTML 文件。',
    module: 'docs',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'docs-delete',
    method: 'DELETE',
    path: '/api/docs/:docId',
    title: '删除笔记文档',
    description: '管理员删除笔记文档，并清理独立 HTML 文件。',
    module: 'docs',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'docs-html',
    method: 'GET',
    path: '/docs-html/:file',
    title: '独立 HTML 文档',
    description: '读取单篇文档对应的独立 HTML 文件，用于内嵌预览和单独分享。',
    module: 'docs',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'posts-list',
    method: 'GET',
    path: '/api/posts?status=published',
    title: '文章列表',
    description: '读取文章列表，前台使用 published，后台用于管理总览。',
    module: 'posts',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'posts-detail',
    method: 'GET',
    path: '/api/posts/:postId',
    title: '文章详情',
    description: '按文章 ID 读取文章详情。',
    module: 'posts',
    auth: 'public',
    audiences: ['web'],
  },
  {
    id: 'posts-create',
    method: 'POST',
    path: '/api/posts',
    title: '创建文章',
    description: '管理员创建文章，当前固定发布到前台文章列表。',
    module: 'posts',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'admin-overview',
    method: 'GET',
    path: '/api/admin/overview',
    title: '后台总览',
    description: '后台总览页读取模块和数量，不加载各模块列表。',
    module: 'system',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'posts-update',
    method: 'PUT',
    path: '/api/posts/:postId',
    title: '更新文章',
    description: '管理员更新文章标题、摘要、正文、分类和封面。',
    module: 'posts',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'posts-delete',
    method: 'DELETE',
    path: '/api/posts/:postId',
    title: '删除文章',
    description: '管理员删除指定文章。',
    module: 'posts',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'music-list',
    method: 'GET',
    path: '/api/music?category=mandarin&q=keyword',
    title: '音乐列表',
    description: '读取音乐列表，支持按后端音乐分类和关键词搜索。',
    module: 'music',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'music-categories',
    method: 'GET',
    path: '/api/music/categories',
    title: '音乐分类',
    description: '读取后端配置的音乐分类列表。',
    module: 'music',
    auth: 'public',
    audiences: ['web', 'admin'],
  },
  {
    id: 'music-favorites',
    method: 'GET',
    path: '/api/music/favorites',
    title: '收藏音乐',
    description: '读取收藏音乐列表。',
    module: 'music',
    auth: 'public',
    audiences: ['web'],
  },
  {
    id: 'music-create',
    method: 'POST',
    path: '/api/music',
    title: '新增音乐',
    description: '登录用户新增音乐元数据；音频文件通过上传接口保存。',
    module: 'music',
    auth: 'user',
    audiences: ['admin'],
  },
  {
    id: 'music-upload',
    method: 'POST',
    path: '/api/music/upload',
    title: '上传音乐',
    description: '登录用户上传音频文件并生成可播放地址。',
    module: 'music',
    auth: 'user',
    audiences: ['admin'],
  },
  {
    id: 'music-update',
    method: 'PUT',
    path: '/api/music/:musicId',
    title: '更新音乐',
    description: '管理员更新音乐标题、歌手、专辑、分类和封面。',
    module: 'music',
    auth: 'admin',
    audiences: ['admin'],
  },
  {
    id: 'music-delete',
    method: 'DELETE',
    path: '/api/music/:musicId',
    title: '删除音乐',
    description: '管理员删除指定音乐记录。',
    module: 'music',
    auth: 'admin',
    audiences: ['admin'],
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

  if (!token.startsWith(authTokenPrefix)) {
    return undefined;
  }

  const userId = token.slice(authTokenPrefix.length);
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
  }
}

async function saveAboutCards() {
  await writeFile(aboutCardsStorePath, `${JSON.stringify(aboutCards, null, 2)}\n`, 'utf8');
}

async function loadCategories() {
  categories = [];
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
  }
}

async function saveDocs() {
  await writeFile(docsStorePath, `${JSON.stringify(docs, null, 2)}\n`, 'utf8');
}

type DocWriteInput = CreateWorkDocBody & {
  htmlSource?: string;
  shouldWriteHtml: boolean;
};

type DocFormFields = Record<string, string>;

const docCategories = new Set<WorkDocCategory>(['deployment', 'shortcut', 'workflow', 'reference']);

function isWorkDocCategory(value: string): value is WorkDocCategory {
  return docCategories.has(value as WorkDocCategory);
}

const musicCategories: MusicCategory[] = [
  {
    id: 'mandarin',
    name: {
      'zh-CN': '\u4e2d\u6587',
      'en-US': 'Chinese',
    },
  },
  {
    id: 'instrumental',
    name: {
      'zh-CN': '\u7eaf\u97f3\u4e50',
      'en-US': 'Instrumental',
    },
  },
  {
    id: 'live',
    name: {
      'zh-CN': '\u73b0\u573a',
      'en-US': 'Live',
    },
  },
  {
    id: 'personal',
    name: {
      'zh-CN': '\u79c1\u85cf',
      'en-US': 'Personal',
    },
  },
];

const musicCategoryIds = new Set<MusicCategoryId>(musicCategories.map((category) => category.id));

function isMusicCategory(value?: string): value is MusicCategoryId {
  return Boolean(value && musicCategoryIds.has(value as MusicCategoryId));
}

function normalizeMusicCategory(value?: string, fallback: MusicCategoryId = 'mandarin') {
  return isMusicCategory(value) ? value : fallback;
}

function splitDocText(value: string) {
  return value
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDocTags(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return (value ?? '')
    .split(/[,锛孿n]/)
    .map((item) => item.trim().replace(/^#/, ''))
    .filter(Boolean);
}

function createDocId(title: string, currentId?: string) {
  const normalized = (currentId || title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const base = normalized || `doc-${Date.now()}`;

  let nextId = base;
  let index = 1;

  while (docs.some((doc) => doc.id === nextId)) {
    index += 1;
    nextId = `${base}-${index}`;
  }

  return nextId;
}

function toPlainDocInput(body: Partial<CreateWorkDocBody> & DocFormFields): DocWriteInput {
  const titleZh = (body.titleZh || body.title || body.content?.['zh-CN']?.title || '').trim();
  const textZh = (body.textZh || body.text || body.content?.['zh-CN']?.body?.join('\n\n') || '').trim();
  const summaryZh = (
    body.summaryZh ||
    body.summary ||
    body.content?.['zh-CN']?.summary ||
    splitDocText(textZh)[0] ||
    titleZh
  ).trim();

  const titleEn = (body.titleEn || body.content?.['en-US']?.title || titleZh).trim();
  const textEn = (body.textEn || body.content?.['en-US']?.body?.join('\n\n') || textZh).trim();
  const summaryEn = (
    body.summaryEn ||
    body.content?.['en-US']?.summary ||
    splitDocText(textEn)[0] ||
    summaryZh
  ).trim();
  const categoryValue = body.category ?? 'reference';
  const htmlSource = (body.htmlSource || body.html || body.htmlContent || '').trim();

  return {
    category: isWorkDocCategory(categoryValue) ? categoryValue : 'reference',
    content: {
      'zh-CN': {
        body: splitDocText(textZh),
        summary: summaryZh,
        title: titleZh,
      },
      'en-US': {
        body: splitDocText(textEn),
        summary: summaryEn,
        title: titleEn,
      },
    },
    html: htmlSource || undefined,
    htmlSource: htmlSource || textZh || textEn || summaryZh,
    shouldWriteHtml: Boolean(htmlSource || textZh || textEn),
    tags: parseDocTags(body.tags),
    updatedAt: (body.updatedAt || new Date().toISOString().slice(0, 10)).trim(),
  };
}

async function readDocRequestInput(request: FastifyRequest): Promise<DocWriteInput> {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).includes('multipart/form-data')) {
    return toPlainDocInput((request.body ?? {}) as Partial<CreateWorkDocBody> & DocFormFields);
  }

  const fields: DocFormFields = {};
  let htmlSource = '';

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      const extension = extname(part.filename || '.html').toLowerCase();

      if (extension && extension !== '.html' && extension !== '.htm') {
        continue;
      }

      const chunks: Buffer[] = [];

      for await (const chunk of part.file) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      htmlSource = Buffer.concat(chunks).toString('utf8').trim();
    } else {
      fields[part.fieldname] = String(part.value ?? '');
    }
  }

  return toPlainDocInput({
    ...fields,
    htmlSource,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStandaloneDocHtml(doc: WorkDoc, sourceText: string) {
  const content = doc.content['zh-CN'];
  const paragraphs = splitDocText(sourceText || content.body.join('\n\n') || content.summary);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(content.title)}</title>
    <style>
      :root { color-scheme: light; font-family: Inter, "Microsoft YaHei", Arial, sans-serif; color: #172026; background: #f7faf9; }
      body { margin: 0; padding: 32px 18px; }
      main { max-width: 920px; margin: 0 auto; border: 1px solid #d9e5e1; border-radius: 12px; background: #fff; box-shadow: 0 18px 45px rgba(23, 32, 38, .08); overflow: hidden; }
      header { padding: 28px; border-bottom: 1px solid #d9e5e1; background: linear-gradient(135deg, #eef8f5, #fff); }
      .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; color: #62746f; font-size: 13px; }
      .pill { border-radius: 999px; background: #e5f3ef; padding: 6px 10px; color: #087b73; font-weight: 700; }
      h1 { margin: 0; font-size: clamp(30px, 5vw, 52px); line-height: 1.08; letter-spacing: 0; }
      .summary { margin: 14px 0 0; color: #53645f; line-height: 1.7; }
      article { padding: 28px; }
      p { margin: 0 0 16px; color: #263733; line-height: 1.9; font-size: 16px; }
      @media (max-width: 640px) { body { padding: 14px; } header, article { padding: 20px; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="meta">
          <span class="pill">${escapeHtml(doc.category)}</span>
          <span>${escapeHtml(doc.updatedAt)}</span>
          ${doc.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}
        </div>
        <h1>${escapeHtml(content.title)}</h1>
        <p class="summary">${escapeHtml(content.summary)}</p>
      </header>
      <article>
        ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n        ')}
      </article>
    </main>
  </body>
</html>
`;
}

async function writeDocHtml(doc: WorkDoc, source: string) {
  if (!doc.htmlFile) {
    return;
  }

  await mkdir(docsHtmlRoot, { recursive: true });
  const trimmed = source.trim();
  const html = /^<!doctype html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)
    ? trimmed
    : renderStandaloneDocHtml(doc, trimmed);

  await writeFile(join(docsHtmlRoot, doc.htmlFile), html, 'utf8');
}

async function removeDocHtmlIfUnused(fileName?: string) {
  if (!fileName || docs.some((doc) => doc.htmlFile === fileName)) {
    return;
  }

  try {
    await unlink(join(docsHtmlRoot, fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
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
  }
}

async function savePosts() {
  await writeFile(postsStorePath, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
}

async function loadMusic() {
  await mkdir(dataRoot, { recursive: true });

  try {
    const content = await readFile(musicStorePath, 'utf8');
    const storedMusic = JSON.parse(content) as Array<FavoriteMusic & { categoryId?: string }>;
    let changed = false;

    favoriteMusic = storedMusic.map((track) => {
      const categoryId = normalizeMusicCategory(track.categoryId);

      if (categoryId !== track.categoryId) {
        changed = true;
      }

      return {
        ...track,
        categoryId,
      };
    });

    if (changed) {
      await saveMusic();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    favoriteMusic = [];
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

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    const adminName = process.env.ADMIN_NAME?.trim() || 'Admin';

    if (adminEmail && adminPassword) {
      userAccounts = [
        {
          createdAt: new Date().toISOString(),
          email: normalizeEmail(adminEmail),
          id: 'u_admin',
          name: adminName,
          passwordHash: hashPassword(adminPassword),
          role: 'admin',
        },
      ];
      await saveUsers();
      return;
    }

    userAccounts = [];
  }
}

async function saveUsers() {
  await writeFile(usersStorePath, `${JSON.stringify(userAccounts, null, 2)}\n`, 'utf8');
}

await server.register(cors, {
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  origin: true,
});

await mkdir(musicUploadDir, { recursive: true });
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
    token: `${authTokenPrefix}${account.id}`,
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
    token: `${authTokenPrefix}${account.id}`,
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

server.get('/api/admin/overview', async (request, reply): Promise<{ modules: AdminOverviewItem[] }> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    } as never);
  }

  return {
    modules: [
      { module: 'articles', count: posts.length },
      { module: 'docs', count: docs.length },
      { module: 'music', count: favoriteMusic.length },
      { module: 'tools', count: 3 },
      { module: 'users', count: userAccounts.length },
      { module: 'endpoints', count: endpointCatalog.length },
    ],
  };
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

server.post('/api/docs', async (request, reply): Promise<WorkDoc> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  const input = await readDocRequestInput(request);
  const title = input.content['zh-CN'].title;

  if (!title) {
    return reply.code(400).send({
      message: 'title is required',
    } as never);
  }

  const id = createDocId(title);
  const doc: WorkDoc = {
    category: input.category,
    content: input.content,
    htmlFile: `${id}.html`,
    id,
    tags: input.tags ?? [],
    updatedAt: input.updatedAt || new Date().toISOString().slice(0, 10),
  };

  await writeDocHtml(doc, input.htmlSource || input.content['zh-CN'].body.join('\n\n'));
  docs.unshift(doc);
  await saveDocs();

  reply.code(201);
  return doc;
});

server.put<{ Params: { docId: string } }>('/api/docs/:docId', async (request, reply): Promise<WorkDoc> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    } as never);
  }

  const index = docs.findIndex((item) => item.id === request.params.docId);

  if (index < 0) {
    return reply.code(404).send({
      message: 'Document not found',
    } as never);
  }

  const previous = docs[index];
  const input = await readDocRequestInput(request);

  if (!input.content['zh-CN'].title) {
    return reply.code(400).send({
      message: 'title is required',
    } as never);
  }

  const updated: WorkDoc = {
    ...previous,
    category: input.category,
    content: input.content,
    htmlFile: previous.htmlFile || `${previous.id}.html`,
    tags: input.tags ?? [],
    updatedAt: input.updatedAt || previous.updatedAt,
  };

  if (input.shouldWriteHtml || !previous.htmlFile) {
    await writeDocHtml(updated, input.htmlSource || input.content['zh-CN'].body.join('\n\n'));
  }

  docs[index] = updated;
  await saveDocs();

  return updated;
});

server.delete<{ Params: { docId: string } }>('/api/docs/:docId', async (request, reply) => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    });
  }

  const target = docs.find((item) => item.id === request.params.docId);

  if (!target) {
    return reply.code(404).send({
      message: 'Document not found',
    });
  }

  docs = docs.filter((item) => item.id !== target.id);
  await saveDocs();
  await removeDocHtmlIfUnused(target.htmlFile);

  return {
    deletedDoc: target,
    ok: true,
  };
});

async function readAllowedDocHtml(fileParam: string, reply: FastifyReply) {
  const file = decodeURIComponent(fileParam);
  const allowed = docs.some((doc) => doc.htmlFile === file);
  const safeFile = file.endsWith('.html') && !file.includes('/') && !file.includes('\\') && !file.includes('..');

  if (!allowed || !safeFile) {
    reply.code(404).send({
      message: 'Document html not found',
    });
    return null;
  }

  try {
    return {
      file,
      html: await readFile(join(docsHtmlRoot, file), 'utf8'),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      reply.code(404).send({
        message: 'Document html not found',
      });
      return null;
    }

    throw error;
  }
}

server.get<{ Params: { file: string } }>('/docs-html/:file/download', async (request, reply) => {
  const result = await readAllowedDocHtml(request.params.file, reply);

  if (!result) {
    return reply;
  }

  reply.header('Cache-Control', 'private, max-age=0');
  reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(result.file)}"`);
  reply.type('text/html; charset=utf-8');
  return result.html;
});

server.get<{ Params: { file: string } }>('/docs-html/:file', async (request, reply) => {
  const result = await readAllowedDocHtml(request.params.file, reply);

  if (!result) {
    return reply;
  }

  reply.header('Cache-Control', 'public, max-age=60');
  reply.type('text/html; charset=utf-8');
  return result.html;
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

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    } as never);
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
    cover: request.body.cover?.trim() || undefined,
    date: now.toISOString().slice(0, 10),
    featured: request.body.featured ?? false,
    publishedAt: now.toISOString().slice(0, 10),
    readingMinutes: request.body.readingMinutes ?? 5,
    status: 'published',
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
      cover: request.body.cover?.trim() || undefined,
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

server.get('/api/music/categories', async (): Promise<MusicCategory[]> => musicCategories);

server.get<{ Querystring: { category?: MusicCategoryId | 'all'; q?: string } }>('/api/music', async (request): Promise<FavoriteMusic[]> => {
  const query = request.query.q?.trim().toLowerCase();
  const category = request.query.category;

  let result = favoriteMusic;

  if (category && category !== 'all' && isMusicCategory(category)) {
    result = result.filter((track) => track.categoryId === category);
  }

  if (!query) {
    return result;
  }

  return result.filter((track) =>
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
    audioUrl: undefined,
    album: request.body.album,
    categoryId: normalizeMusicCategory(request.body.categoryId, 'personal'),
    cover: request.body.cover,
    createdAt: now,
    platform: request.body.platform,
    source: 'upload',
    title: request.body.title,
    url: undefined,
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
    categoryId: normalizeMusicCategory(fields.categoryId, 'personal'),
    cover: fields.cover || undefined,
    createdAt: new Date().toISOString(),
    platform: undefined,
    source: 'upload',
    title: fields.title,
    url: uploadedAudioUrl,
  };

  favoriteMusic.unshift(track);
  await saveMusic();
  reply.code(201);
  return track;
});

server.put<{ Body: CreateMusicBody; Params: { musicId: string } }>(
  '/api/music/:musicId',
  async (request, reply): Promise<FavoriteMusic> => {
    const user = requireAuthenticatedUser(request, reply);

    if (!user) {
      return undefined as never;
    }

    if (user.role !== 'admin') {
      return reply.code(403).send({
        message: 'Admin role is required',
      } as never);
    }

    const index = favoriteMusic.findIndex((track) => track.id === request.params.musicId);

    if (index < 0) {
      return reply.code(404).send({
        message: 'Music not found',
      } as never);
    }

    const previous = favoriteMusic[index];
    const updated: FavoriteMusic = {
      ...previous,
      album: request.body.album || undefined,
      artist: request.body.artist,
      audioUrl: previous.audioUrl,
      categoryId: normalizeMusicCategory(request.body.categoryId, previous.categoryId),
      cover: request.body.cover || undefined,
      platform: request.body.platform || previous.platform,
      source: previous.source,
      title: request.body.title,
      url: previous.url,
    };

    favoriteMusic[index] = updated;
    await saveMusic();

    return updated;
  },
);

server.delete<{ Params: { musicId: string } }>('/api/music/:musicId', async (request, reply) => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  if (user.role !== 'admin') {
    return reply.code(403).send({
      message: 'Admin role is required',
    });
  }

  const target = favoriteMusic.find((track) => track.id === request.params.musicId);

  if (!target) {
    return reply.code(404).send({
      message: 'Music not found',
    });
  }

  favoriteMusic = favoriteMusic.filter((track) => track.id !== target.id);
  await saveMusic();

  return {
    deletedMusic: target,
    ok: true,
  };
});

const port = Number(process.env.PORT ?? 4000);

try {
  await server.listen({ host: '0.0.0.0', port });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
