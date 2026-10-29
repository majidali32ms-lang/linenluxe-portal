/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Exact brand colors pulled from the LinenLuxe website CSS
        gold: {
          DEFAULT: '#c9a24b',
          strong: '#b8902f',
          soft: '#e8d9a8',
          tint: 'rgba(201, 162, 75, 0.08)',
        },
        navy: {
          DEFAULT: '#1a2a4a',
          light: '#243a63',
        },
        cream: '#faf7f0',
        marble: '#f4f1ea',
        ink: '#333333',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        luxe: '0 10px 40px -12px rgba(26, 42, 74, 0.25)',
        card: '0 4px 20px -8px rgba(26, 42, 74, 0.18)',
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
      },
    },
  },
  plugins: [],
}
