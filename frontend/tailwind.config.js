
/** @type {import('tailwindcss').Config} */

export default {

  content: [

    "./index.html",

    "./src/**/*.{js,jsx,ts,tsx}"

  ],

  darkMode: 'class',

  theme: {

    extend: {

      colors: {

        brand: {

          500: '#3b82f6',

          600: '#2563eb',

          700: '#1d4ed8'

        }

      },

      boxShadow: {

        card: '0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.10)'

      }

    }

  },

  plugins: []

};

