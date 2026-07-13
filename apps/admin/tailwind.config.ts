import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f7fb',
        ink: '#151824',
        line: '#dedfeb',
        panel: '#ffffff',
        brand: '#2563eb',
        mint: '#0f9f7f',
        coral: '#ef5b5b',
        amber: '#f59e0b',
      },
      boxShadow: {
        panel: '0 16px 44px rgba(21, 24, 36, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
