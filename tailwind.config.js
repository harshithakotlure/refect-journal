/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Notion-inspired neutral palette
        notion: {
          bg: '#ffffff',
          surface: '#f7f6f3',
          border: '#e9e9e7',
          text: {
            primary: '#37352f',
            secondary: '#787774',
            tertiary: '#9b9a97',
          },
          accent: {
            subtle: '#f1f1ef',
            soft: '#e3e2e0',
          }
        },
        // Muted colors for mood indicators (very subtle)
        mood: {
          great: '#d3e5ef',
          good: '#e8eff5',
          okay: '#f0f0ee',
          down: '#e7e4e0',
          stressed: '#f5ebe5',
        }
      },
    },
  },
  plugins: [],
}
