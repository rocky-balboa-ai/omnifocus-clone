import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
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
          // Dark mode colors (default)
          bg: '#18181B',
          sidebar: '#1E1E2E',
          surface: '#2A2A3C',
          border: '#3F3F5C',
          // Light mode colors
          'light-bg': '#F8FAFC',
          'light-sidebar': '#FFFFFF',
          'light-surface': '#F1F5F9',
          'light-border': '#E2E8F0',
        },
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-out-down': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'slide-out-down': 'slide-out-down 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
