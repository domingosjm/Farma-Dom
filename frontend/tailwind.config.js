/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FarmaDom Brand Colors
        farma: {
          // Dark blue (logo house/phone)
          blue: {
            50: '#E8F4FC',
            100: '#D1E9F9',
            200: '#A3D4F3',
            300: '#75BEED',
            400: '#47A9E7',
            500: '#1A93E1',
            600: '#1576B4',
            700: '#105887',
            800: '#0A3A5A',
            900: '#051D2D',
          },
          // Cyan/Teal (gradient accent)
          cyan: {
            50: '#E6FAFE',
            100: '#CCF5FD',
            200: '#99EBFB',
            300: '#66E1F9',
            400: '#33D7F7',
            500: '#00CDF5',
            600: '#00A4C4',
            700: '#007B93',
            800: '#005262',
            900: '#002931',
          },
          // Purple (logo "Dom")
          purple: {
            50: '#F5E8F8',
            100: '#EBD1F1',
            200: '#D7A3E3',
            300: '#C375D5',
            400: '#AF47C7',
            500: '#9B1AB9',
            600: '#7C1594',
            700: '#5D106F',
            800: '#3E0A4A',
            900: '#1F0525',
          },
        },
        // Semantic colors
        primary: {
          50: '#E8F4FC',
          100: '#D1E9F9',
          200: '#A3D4F3',
          300: '#75BEED',
          400: '#47A9E7',
          500: '#1576B4',
          600: '#105887',
          700: '#0A3A5A',
          800: '#072B43',
          900: '#051D2D',
        },
        accent: {
          50: '#F5E8F8',
          100: '#EBD1F1',
          200: '#D7A3E3',
          300: '#C375D5',
          400: '#AF47C7',
          500: '#9B1AB9',
          600: '#7C1594',
          700: '#5D106F',
          800: '#3E0A4A',
          900: '#1F0525',
        },
      },
      backgroundImage: {
        'farma-gradient': 'linear-gradient(135deg, #0A3A5A 0%, #1576B4 50%, #7C1594 100%)',
        'farma-gradient-light': 'linear-gradient(135deg, #E8F4FC 0%, #D1E9F9 50%, #F5E8F8 100%)',
        'farma-header': 'linear-gradient(90deg, #0A3A5A 0%, #105887 100%)',
      },
      boxShadow: {
        'farma': '0 4px 20px rgba(21, 118, 180, 0.15)',
        'farma-lg': '0 10px 40px rgba(21, 118, 180, 0.2)',
        'accent': '0 4px 20px rgba(155, 26, 185, 0.15)',
      },
    },
  },
  plugins: [],
}
