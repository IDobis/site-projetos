import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f3efe6',
        ink: '#1f1a17',
        pine: '#0f5c56',
      },
      fontFamily: {
        sans: ['Avenir Next', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 26, 23, 0.06), 0 8px 24px rgba(31, 26, 23, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
