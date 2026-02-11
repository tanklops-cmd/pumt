/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        corrections: {
          blue: '#197d92',
          'blue-dark': '#126070',
          'blue-light': '#2a9db0',
          'blue-pale': '#e8f4f6',
          charcoal: '#2d2d2d',
          stone: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
