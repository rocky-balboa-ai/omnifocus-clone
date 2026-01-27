import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        omnifocus: {
          purple: '#8B5CF6',
          orange: '#F97316',
          bg: '#18181B',
          sidebar: '#1E1E2E',
          surface: '#2A2A3C',
          border: '#3F3F5C',
        },
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};

export default config;
