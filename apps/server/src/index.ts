import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  ApiPost,
  AuthLoginBody,
  AuthLoginResponse,
  Category,
  CreateMusicBody,
  CreatePostBody,
  FavoriteMusic,
  Locale,
  PostStatus,
  User,
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
const musicStorePath = join(dataRoot, 'music.json');
const postsStorePath = join(dataRoot, 'posts.json');

const users: User[] = [
  { id: 'u_admin', name: 'Admin', email: 'admin@example.com', role: 'admin' },
  { id: 'u_author', name: 'Author', email: 'author@example.com', role: 'author' },
];

const passwords: Record<string, string> = {
  'admin@example.com': 'admin123',
  'author@example.com': 'author123',
};

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
  return users.find((user) => user.id === userId);
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
let favoriteMusic: FavoriteMusic[] = [];
let posts: ApiPost[] = [];

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

await server.register(cors, {
  origin: true,
});

await mkdir(musicUploadDir, { recursive: true });
await ensureDemoAudioFiles();
await loadAboutCards();
await loadCategories();
await loadMusic();
await loadPosts();

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
  const user = users.find((item) => item.email === request.body.email);
  const validPassword = passwords[request.body.email] === request.body.password;

  if (!user || !validPassword) {
    return reply.code(401).send({
      message: 'Invalid email or password',
    } as never);
  }

  return {
    token: `demo-token-${user.id}`,
    user,
  };
});

server.get('/api/users/me', async (request, reply): Promise<User> => {
  const user = requireAuthenticatedUser(request, reply);

  if (!user) {
    return undefined as never;
  }

  return user;
});

server.get('/api/categories', async (): Promise<Category[]> => categories);

server.get('/api/about/cards', async (): Promise<AboutCard[]> => aboutCards);

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
