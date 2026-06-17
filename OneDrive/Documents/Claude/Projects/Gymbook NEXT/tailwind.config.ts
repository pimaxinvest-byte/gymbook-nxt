import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary:  { DEFAULT: '#3B82F6', dark: '#2563EB' },
        accent:   { DEFAULT: '#EAB308', dark: '#CA8A04' },

        // Backgrounds
        bg:       '#0A0A0A',
        surface:  { DEFAULT: '#121212', 2: '#1A1A1A', 3: '#1E1E1E', 4: '#222222' },

        // Text
        text: {
          DEFAULT:   '#F1F1F1',
          secondary: '#A1A1AA',
          muted:     '#71717A',
        },

        // Semantic
        success: '#22C55E',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#0EA5E9',

        // Border
        border: { DEFAULT: '#27272A', light: '#3F3F46' },
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}

export default config
