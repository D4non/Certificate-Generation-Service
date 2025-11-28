/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
            accent: {
              DEFAULT: 'var(--org-accent, #5500d8)',
              50: '#f3e8ff',
              100: '#e9d5ff',
              200: '#d8b4fe',
              300: '#c084fc',
              400: '#a855f7',
              500: 'var(--org-accent, #5500d8)',
              600: '#4600b5',
              700: '#370092',
              800: '#28006f',
              900: '#19004c',
            },
            org: {
              primary: 'var(--org-primary)',
              accent: 'var(--org-accent)',
            },
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'premium': '0 2px 8px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.04)',
      },
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
      },
    },
  },
  plugins: [],
}

