/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#1A56DB',
        surface:   '#F9FAFB',
        success:   '#059669',
        warning:   '#D97706',
        danger:    '#DC2626',
        teal:      '#0D9488',
        diamond:   '#0369A1',
        'light-diamond': '#E0F2FE',
        gray: {
          DEFAULT: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
