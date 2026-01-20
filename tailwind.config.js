/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HawkSight color palette
        charcoal: '#0B0C10',
        'charcoal-light': '#1F2833',
        steel: '#3A3F47',
        'steel-light': '#4A5058',
        mist: '#F2F2F2',
        amber: '#E8832A',
        'amber-light': '#ff9942',
        'amber-dark': '#c56a1a',
        glacier: '#3DB2E0',
        'glacier-light': '#5bc4ed',
        moss: '#6DAA75',
        'moss-light': '#8bc492',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
