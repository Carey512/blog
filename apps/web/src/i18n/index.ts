import type { Locale } from '@blog/shared';
import { enUSLocale, enUSMessages } from './en-US';
import type { LocaleMessages, LocaleOption, RouteLabelKey } from './types';
import { zhCNLocale, zhCNMessages } from './zh-CN';

export type { LocaleMessages, LocaleOption, RouteLabelKey };

export const locales: LocaleOption[] = [zhCNLocale, enUSLocale];

export const messages: Record<Locale, LocaleMessages> = {
  'zh-CN': zhCNMessages,
  'en-US': enUSMessages,
};
