import type { ComponentType } from 'react';
import type { RouteLabelKey } from '../i18n';
import { AboutPage } from '../pages/AboutPage';
import { ArticlesPage } from '../pages/ArticlesPage';
import { BlogHomePage } from '../pages/BlogHomePage';
import { DocDetailPage } from '../pages/DocDetailPage';
import { DocsPage } from '../pages/DocsPage';
import { LoginPage } from '../pages/LoginPage';
import { MusicPage } from '../pages/MusicPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import {
  IpLookupToolPage,
  QrCodeToolPage,
  TimestampToolPage,
  ToolsPage,
} from '../pages/ToolsPage';

export type RegisteredPage = {
  path: string;
  Component: ComponentType;
  navKey?: RouteLabelKey;
  showInNav?: boolean;
};

export const registeredPages: RegisteredPage[] = [
  {
    path: '/',
    Component: BlogHomePage,
    navKey: 'home',
    showInNav: true,
  },
  {
    path: '/articles',
    Component: ArticlesPage,
    navKey: 'articles',
    showInNav: true,
  },
  {
    path: '/music',
    Component: MusicPage,
    navKey: 'music',
    showInNav: true,
  },
  {
    path: '/docs',
    Component: DocsPage,
    navKey: 'docs',
    showInNav: true,
  },
  {
    path: '/tools',
    Component: ToolsPage,
    navKey: 'tools',
    showInNav: true,
  },
  {
    path: '/tools/timestamp',
    Component: TimestampToolPage,
  },
  {
    path: '/tools/ip-lookup',
    Component: IpLookupToolPage,
  },
  {
    path: '/tools/qr-code',
    Component: QrCodeToolPage,
  },
  {
    path: '/about',
    Component: AboutPage,
    navKey: 'about',
    showInNav: true,
  },
  {
    path: '/posts/:postId',
    Component: PostDetailPage,
  },
  {
    path: '/docs/:docId',
    Component: DocDetailPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
];

export const navigationPages = registeredPages.filter((page) => page.showInNav && page.navKey);
