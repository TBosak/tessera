/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0B',
        paper: '#F7F7F7',
        primary: '#2D5BFF',
        secondary: '#FF3D3D',
        accent: '#38E54D',
      },
      borderWidth: {
        '3': '3px',
      },
      ringWidth: {
        '3': '3px',
      },
      borderRadius: {
        'brutal': '12px',
      },
      boxShadow: {
        'brutal': '6px 6px 0 0 rgba(0,0,0,1)',
        'brutal-lg': '8px 8px 0 0 rgba(0,0,0,1)',
      },
      spacing: {
        '3': '12px',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': 'clamp(32px, 5vw, 56px)',
      },
    },
  },
  plugins: [],
};