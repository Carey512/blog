# Blog Platform

这是一个 monorepo 项目，根目录统一管理多套应用代码。

## 目录结构

```txt
blog/
  apps/
    web/       博客前台
    admin/     管理后台
    server/    后端 API
  packages/
    shared/    前后台和后端共用类型
```

## 项目说明

- `apps/web`：博客前台，支持中英文、多皮肤、多页面路由、文章页和音乐页。
- `apps/admin`：管理后台，已区分总览、文章管理、音乐管理、用户管理、知识源、分享配置模块。
- `apps/server`：Node.js API 服务，当前提供健康检查、登录、文章查询/创建、分类、音乐查询/创建/上传接口。
- `packages/shared`：共享类型，例如用户、文章、分类、登录响应和音乐收藏。

## 当前文章数据流

```txt
admin 新建文章
  -> server /api/posts 保存到后端 JSON 数据
  -> web /api/posts?status=published 读取已发布文章
```

当前后端使用 JSON 文件做临时持久化，默认不再内置示例文章。下一步建议接入 SQLite/PostgreSQL。

运行时内容数据不再提交到 Git，包括：

- `apps/server/data/about-cards.json`
- `apps/server/data/docs.json`
- `apps/server/data/docs-html/`
- `apps/server/data/music.json`
- `apps/server/data/posts.json`
- `apps/server/data/uploaded-posts.json`
- `apps/server/data/users.json`

分类接口不再依赖本地分类文件，目前 `/api/categories` 返回空数组，后续可改为读取数据库或分类管理接口。

## 当前音乐数据流

```txt
admin 音乐管理上传文件或添加外部音频链接
  -> server /api/music 或 /api/music/upload 保存音乐
  -> web /music 调用 /api/music 搜索、播放音乐
```

音乐数据默认不再内置示例歌曲。上传文件当前保存在 `apps/server/uploads/music`，该目录是运行时文件，已加入 `.gitignore`。

## 启动

先安装依赖：

```bash
npm install
```

启动后端：

```bash
npm run dev:server
```

启动博客前台：

```bash
npm run dev:web
```

启动管理后台：

```bash
npm run dev:admin
```

默认地址：

```txt
前台：http://localhost:5173/
后台：http://localhost:5174/
接口：http://localhost:4000/
```

常用页面：

```txt
前台文章：http://localhost:5173/articles
前台音乐：http://localhost:5173/music
后台文章：http://localhost:5174/articles
后台音乐：http://localhost:5174/music
```

管理后台账号：

```txt
由线上服务器的用户数据或 ADMIN_EMAIL / ADMIN_PASSWORD 环境变量初始化。
```

## 构建

```bash
npm run build
```
