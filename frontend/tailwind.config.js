/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: {
          DEFAULT: 'var(--cv-sidebar)',
          hover: 'var(--cv-sidebar-hover)',
          active: 'var(--cv-sidebar-active)',
          border: 'var(--cv-sidebar-border)',
        },
        app: 'var(--cv-bg)',
        surface: 'var(--cv-surface)',
        border: 'var(--cv-border)',
        ink: {
          primary: 'var(--cv-text-primary)',
          secondary: 'var(--cv-text-secondary)',
          muted: 'var(--cv-text-muted)',
        },
        brand: {
          blue: 'var(--cv-primary)',
          violet: 'var(--cv-accent)',
        },
        semantic: {
          success: 'var(--cv-success)',
          danger: 'var(--cv-danger)',
          warning: 'var(--cv-warning)',
        },
      },
      borderRadius: {
        card: '12px',
        control: '10px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.05)',
        'card-hover': '0 8px 24px rgba(16, 24, 40, 0.08)',
        modal: '0 20px 50px rgba(15, 23, 42, 0.16)',
      },
      maxWidth: {
        page: '1280px',
      },
    },
  },
  plugins: [],
};
