export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#fdf6f0',
          card: '#ffffff',
          primary: '#e11d48',
          primaryLight: '#fff1f5',
          amber: '#f59e0b',
          sky: '#0ea5e9',
          emerald: '#10b981',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
