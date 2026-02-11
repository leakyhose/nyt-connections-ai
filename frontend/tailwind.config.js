/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-group-yellow',
    'bg-group-green',
    'bg-group-blue',
    'bg-group-purple',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Libre Franklin"', 'sans-serif'],
      },
      colors: {
        tile: '#efefe6',
        'tile-hover': '#dadad2',
        'tile-selected': '#5a594e',
        'group-yellow': '#f9df6d',
        'group-green': '#a0c35a',
        'group-blue': '#b0c4ef',
        'group-purple': '#ba81c5',
      },
      maxWidth: {
        game: '624px',
      },
    },
  },
  plugins: [],
}
