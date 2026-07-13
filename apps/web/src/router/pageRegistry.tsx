import type { ComponentType } from 'react';
import type { RouteLabelKey } from '../i18n';
import { AboutPage } from '../pages/AboutPage';
import { ArticlesPage } from '../pages/ArticlesPage';
import { BlogHomePage } from '../pages/BlogHomePage';
import { LoginPage } from '../pages/LoginPage';
import { MusicPage } from '../pages/MusicPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { SubmitPage } from '../pages/SubmitPage';

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
    path: '/submit',
    Component: SubmitPage,
    navKey: 'submit',
    showInNav: true,
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
    path: '/login',
    Component: LoginPage,
  },
];

export const navigationPages = registeredPages.filter((page) => page.showInNav && page.navKey);
