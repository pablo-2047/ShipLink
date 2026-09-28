/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: "#ffffff",
        surface: "#f8fafc",
        well: "#f1f5f9",
        border: "#e2e8f0",
        charcoal: {
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
        },
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
        },
        marine: {
          emerald: "#059669",
          amber: "#d97706",
          rose: "#dc2626",
          indigo: "#4f46e5",
        }
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'neo': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'neo-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
        'neo-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'neo-inner': 'inset 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'neo-btn': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'ship-sail': 'shipSail 18s linear infinite',
        'waterline-bob': 'waterlineBob 3s ease-in-out infinite alternate',
        'wave-flow': 'waveFlow 4s linear infinite',
        'sonar-ping': 'sonarPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'water-ripple': 'waterRipple 2s linear infinite',
      },
      keyframes: {
        shipSail: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(1200%)' },
        },
        waterlineBob: {
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-3px) rotate(0.5deg)' },
          '100%': { transform: 'translateY(2px) rotate(-0.5deg)' },
        },
        waveFlow: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        sonarPing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '70%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        waterRipple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}
