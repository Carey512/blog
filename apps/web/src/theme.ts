import type { Locale } from '@blog/shared';

export const themes = [
  {
    id: 'paper',
    label: { 'zh-CN': '纸张', 'en-US': 'Paper' },
    description: { 'zh-CN': '清爽青绿与珊瑚色', 'en-US': 'Clean teal and coral' },
    swatches: ['#f8fafc', '#14746f', '#d85c43'],
  },
  {
    id: 'ink',
    label: { 'zh-CN': '墨夜', 'en-US': 'Ink' },
    description: { 'zh-CN': '深色背景配高亮青黄', 'en-US': 'Dark base with cyan and amber' },
    swatches: ['#171821', '#45d6c5', '#f4b860'],
  },
  {
    id: 'jade',
    label: { 'zh-CN': '青玉', 'en-US': 'Jade' },
    description: { 'zh-CN': '绿意底色配梅子紫', 'en-US': 'Botanical green with plum' },
    swatches: ['#eef8f1', '#20785c', '#a64c87'],
  },
  {
    id: 'sunrise',
    label: { 'zh-CN': '晨光', 'en-US': 'Sunrise' },
    description: { 'zh-CN': '暖白、玫红和湖蓝', 'en-US': 'Warm white, rose, and blue' },
    swatches: ['#fff7ed', '#c2415b', '#1f7a9b'],
  },
  {
    id: 'candy',
    label: { 'zh-CN': '糖果', 'en-US': 'Candy' },
    description: { 'zh-CN': '明快粉色、蓝色和柠檬黄', 'en-US': 'Pink, blue, and lemon' },
    swatches: ['#fff1f7', '#db2777', '#facc15'],
  },
  {
    id: 'lagoon',
    label: { 'zh-CN': '泻湖', 'en-US': 'Lagoon' },
    description: { 'zh-CN': '水蓝、海绿和番茄红', 'en-US': 'Aqua, sea green, and tomato' },
    swatches: ['#eefcff', '#0284c7', '#ef4444'],
  },
  {
    id: 'orchard',
    label: { 'zh-CN': '果园', 'en-US': 'Orchard' },
    description: { 'zh-CN': '叶绿、葡萄紫和杏橙', 'en-US': 'Leaf green, grape, and apricot' },
    swatches: ['#f7fee7', '#65a30d', '#c026d3'],
  },
  {
    id: 'studio',
    label: { 'zh-CN': '工作室', 'en-US': 'Studio' },
    description: { 'zh-CN': '中性底色配电光蓝橙', 'en-US': 'Neutral canvas with blue and orange' },
    swatches: ['#f5f5f4', '#2563eb', '#f97316'],
  },
] as const;

export type ThemeName = (typeof themes)[number]['id'];

export function getThemeLabel(themeId: ThemeName, locale: Locale) {
  return themes.find((theme) => theme.id === themeId)?.label[locale] ?? themeId;
}
