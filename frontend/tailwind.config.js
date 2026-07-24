/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#050505",
        surface: {
          1: "#121212",
          2: "#1e1e1e",
          3: "#262626",
        },
        hairline: "rgba(255, 255, 255, 0.10)",
        "hairline-soft": "rgba(255, 255, 255, 0.05)",
        "accent-blue": "#0099FF",
        ink: "#FFFFFF",
        "ink-muted": "#999999",
        semantic: {
          success: "#10B981",
        }
      },
      letterSpacing: {
        'display-xxl': '-5.5px',
        'display-xl': '-4.25px',
        'display-lg': '-3.1px',
        'display-md': '-1.0px',
        'headline': '-0.8px',
        'subhead': '-0.01px',
        'body-lg': '-0.18px',
        'body': '-0.15px',
        'body-sm': '-0.14px',
        'caption': '-0.13px',
        'micro': '-0.12px',
      },
      lineHeight: {
        'display-xxl': '0.85',
        'display-xl': '0.95',
        'display-lg': '1.00',
        'display-md': '1.13',
        'headline': '1.20',
        'subhead': '1.30',
        'body-lg': '1.30',
        'body': '1.30',
        'body-sm': '1.40',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '15px',
        'xl': '20px',
        'xxl': '30px',
        'pill': '100px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'Mona Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'framer-drop': '0px 10px 30px rgba(0, 0, 0, 0.5)',
        'framer-light-edge': 'inset 0px 1px 0px rgba(255, 255, 255, 0.10), 0px 10px 30px rgba(0, 0, 0, 0.4)',
        'framer-focus': '0px 0px 0px 1px rgba(0, 153, 255, 0.5), 0px 0px 15px rgba(0, 153, 255, 0.2)',
      }
    },
  },
  plugins: [],
}
