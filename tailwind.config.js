/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors mapped to CSS variables using modern syntax for opacity support
        terreta: {
          bg: 'rgb(var(--bg-main) / <alpha-value>)',
          sidebar: 'rgb(var(--sidebar-bg) / <alpha-value>)',
          nav: 'rgb(var(--nav-bg) / <alpha-value>)',
          dark: 'rgb(var(--text-main) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          deep: '#231715', // Keep specific if needed
          olive: '#556B2F', // Keep fixed
          gold: '#D4AF37', // Keep fixed
          accent: 'rgb(var(--accent) / <alpha-value>)',
          card: 'rgb(var(--card-bg) / <alpha-value>)',
          border: 'rgb(var(--border-color) / <alpha-value>)',
        },
        // Fallback or explicit extensions if used elsewhere
        bg: {
          main: 'rgb(var(--bg-main) / <alpha-value>)',
          nav: 'rgb(var(--nav-bg) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-main) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          accent: 'rgb(var(--accent) / <alpha-value>)',
        },
        border: {
          primary: 'rgb(var(--border-color) / <alpha-value>)',
          accent: 'rgb(var(--accent) / <alpha-value>)',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Lora"', '"Montserrat"', 'system-ui', 'sans-serif'],
        body: ['"Lora"', '"Georgia"', 'serif'], // Vintage serif for body text
        display: ['"Playfair Display"', 'serif'], // Display font for headings
      },
      fontSize: {
        'm-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'm-base': ['1rem', { lineHeight: '1.5rem' }],
        'm-lg': ['1.25rem', { lineHeight: '1.75rem' }],
        'm-xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      borderRadius: {
        shell: '8px',
        sheet: '16px',
      },
      boxShadow: {
        shell: '0 1px 2px rgb(45 41 38 / 0.08)',
        raised: '0 4px 12px rgb(45 41 38 / 0.12)',
      },
      transitionDuration: {
        shell: '150ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: [],
}
