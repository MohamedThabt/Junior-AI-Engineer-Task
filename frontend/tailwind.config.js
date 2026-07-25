/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand & Accent
        primary: "#292524",
        "primary-active": "#0c0a09",

        // Surface & Canvas
        canvas: "#f5f5f5",
        "canvas-soft": "#fafafa",
        "canvas-deep": "#0c0a09",
        "surface-card": "#ffffff",
        "surface-strong": "#f0efed",
        "surface-dark": "#0c0a09",
        "surface-dark-elevated": "#1c1917",

        // Hairlines
        hairline: "#e7e5e4",
        "hairline-soft": "#f0efed",
        "hairline-strong": "#d6d3d1",

        // Text
        ink: "#0c0a09",
        body: "#4e4e4e",
        "body-strong": "#292524",
        muted: "#777169",
        "muted-soft": "#a8a29e",
        "on-primary": "#ffffff",
        "on-dark": "#ffffff",
        "on-dark-soft": "#a8a29e",

        // Atmospheric Gradient Stops (signature decorative tokens)
        "gradient-mint": "#a7e5d3",
        "gradient-peach": "#f4c5a8",
        "gradient-lavender": "#c8b8e0",
        "gradient-sky": "#a8c8e8",
        "gradient-rose": "#e8b8c4",

        // Semantic
        semantic: {
          success: "#16a34a",
          error: "#dc2626",
        }
      },
      letterSpacing: {
        'display-mega': '-1.92px',
        'display-xl': '-0.96px',
        'display-lg': '-0.36px',
        'display-md': '-0.32px',
        'title-sm': '0.18px',
        'body-md': '0.16px',
        'body-sm': '0.15px',
        'caption-uppercase': '0.96px',
      },
      lineHeight: {
        'display-mega': '1.05',
        'display-xl': '1.08',
        'display-lg': '1.17',
        'display-md': '1.13',
        'display-sm': '1.20',
        'title-md': '1.35',
        'title-sm': '1.44',
        'body': '1.50',
        'caption-uppercase': '1.40',
      },
      borderRadius: {
        'none': '0px',
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'xxl': '24px',
        'pill': '9999px',
        'full': '9999px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      spacing: {
        'xxs': '4px',
        'xs': '8px',
        'sm': '12px',
        'base': '16px',
        'md': '20px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
        'section': '96px',
      },
      boxShadow: {
        'soft-drop': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 30px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}

