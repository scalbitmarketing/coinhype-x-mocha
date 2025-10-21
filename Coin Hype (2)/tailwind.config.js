/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(124, 58, 237, 0.5), 0 0 10px rgba(124, 58, 237, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(124, 58, 237, 0.8), 0 0 30px rgba(124, 58, 237, 0.4)' 
          },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
