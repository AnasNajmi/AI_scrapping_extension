/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
    "./dist/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'chrome-dark': '#18181b',
        'chrome-darker': '#23232a', 
        'chrome-border': '#222',
        'purple-primary': '#7c3aed',
        'purple-light': '#a78bfa',
      },
      width: {
        'sidebar': '350px',
      },
      height: {
        'sidebar': '100vh',
      }
    },
  },
  plugins: [],
};
