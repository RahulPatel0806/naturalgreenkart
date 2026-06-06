/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Instamart-inspired fresh green palette.
        primary: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
          light: '#DCFCE7',
        },
        accent: '#F97316',
        ink: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          soft: '#94A3B8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
        },
        danger: '#DC2626',
        warning: '#D97706',
        success: '#16A34A',
      },
    },
  },
  plugins: [],
};
