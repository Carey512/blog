import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--color-background) / <alpha-value>)',
        foreground: 'hsl(var(--color-foreground) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        'surface-muted': 'hsl(var(--color-surface-muted) / <alpha-value>)',
        border: 'hsl(var(--color-border) / <alpha-value>)',
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        'primary-foreground': 'hsl(var(--color-primary-foreground) / <alpha-value>)',
        accent: 'hsl(var(--color-accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--color-accent-foreground) / <alpha-value>)',
        muted: 'hsl(var(--color-muted) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 18px 50px hsl(var(--color-shadow) / 0.16)',
        line: '0 1px 0 hsl(var(--color-border) / 0.75)',
      },
    },
  },
  plugins: [],
} satisfies Config;
