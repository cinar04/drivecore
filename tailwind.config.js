/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          50: '#EFF6FF',
          100: '#DBEAFE',
          300: 'rgb(var(--accent-light-rgb) / <alpha-value>)',
          400: 'rgb(var(--accent-light-rgb) / <alpha-value>)',
          500: 'rgb(var(--accent-rgb) / <alpha-value>)',
          600: 'rgb(var(--accent-rgb) / <alpha-value>)',
          700: 'rgb(var(--accent-rgb) / <alpha-value>)',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: '#06B6D4',
          500: '#06B6D4',
          600: '#0891B2',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        bg: {
          DEFAULT: '#0F172A',
          surface: '#1E293B',
          card: '#111827',
        },
        // Açık mod arka planları
        light: {
          bg: '#F1F5F9',
          surface: '#FFFFFF',
          card: '#F8FAFC',
          border: 'rgba(0,0,0,0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'counter': 'counter 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'light': '0 2px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
