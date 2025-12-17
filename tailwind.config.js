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
        // Semantic colors mapped to CSS variables
        terreta: {
          bg: 'var(--bg-main)',
          sidebar: 'var(--sidebar-bg)', // Added for sidebar
          dark: 'var(--text-main)',
          secondary: 'var(--text-secondary)',
          deep: '#231715', // Keep specific if needed, or map to nav-bg for dark themes?
          olive: '#556B2F', // Keep fixed
          gold: '#D4AF37', // Keep fixed
          accent: 'var(--accent)',
          card: 'var(--card-bg)',
          border: 'var(--border-color)',
        },
        // Requested extensions
        bg: {
          main: 'var(--bg-main)',
          nav: 'var(--nav-bg)',
        },
        text: {
          primary: 'var(--text-main)',
          secondary: 'var(--text-secondary)',
          accent: 'var(--accent)',
        },
        border: {
          primary: 'var(--border-color)',
          accent: 'var(--accent)',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Lato"', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    }
  },
  plugins: [],
}
