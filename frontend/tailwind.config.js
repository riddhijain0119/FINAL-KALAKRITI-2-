/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        umber: {
          DEFAULT: '#2C1810',
          light: '#3D3530',
          dark: '#1A0E09',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C96A',
          dark: '#A07830',
          muted: '#D4B878',
        },
        rice: {
          DEFAULT: '#FAF6F0',
          dark: '#F0EAE0',
          darker: '#E8DDD0',
        },
        warm: {
          white: '#FFFDF9',
          gray: '#9C8878',
          border: '#E0D5C8',
        },
      },
      backgroundImage: {
        'paper-texture': "url('/assets/images/paper-texture.png')",
        'gold-gradient': 'linear-gradient(135deg, #E8C96A 0%, #C9A84C 50%, #A07830 100%)',
        'umber-gradient': 'linear-gradient(180deg, #2C1810 0%, #3D3530 100%)',
      },
      boxShadow: {
        'luxury': '0 4px 24px rgba(44, 24, 16, 0.08)',
        'luxury-lg': '0 8px 48px rgba(44, 24, 16, 0.12)',
        'gold': '0 4px 20px rgba(201, 168, 76, 0.25)',
        'inset-luxury': 'inset 0 1px 3px rgba(44, 24, 16, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'price-pulse': 'pricePulse 0.4s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pricePulse: {
          '0%': { backgroundColor: 'rgba(201, 168, 76, 0)' },
          '50%': { backgroundColor: 'rgba(201, 168, 76, 0.15)' },
          '100%': { backgroundColor: 'rgba(201, 168, 76, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};