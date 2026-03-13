/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        bg: {
          50: '#0a0a0f',
          100: '#121218',
          200: '#1e1e28',
        },
        text: {
          50: '#f9fafb',
          200: '#e5e7eb',
          400: '#9ca3af',
          600: '#4b5563',
        },
        border: {
          300: '#374151',
          400: '#4b5563',
        },
        code: {
          bg: '#1a1a22',
          border: '#2d2d3a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
