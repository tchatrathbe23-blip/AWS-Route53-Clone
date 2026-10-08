/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aws: {
          dark: '#0f172a',
          nav: '#232f3e',
          navHover: '#131921',
          orange: '#ec7211',
          orangeHover: '#eb5f07',
          blue: '#0073bb',
          blueHover: '#005b94',
          grayBg: '#f2f3f3',
          border: '#eaeded',
          darkBorder: '#334155',
          textMuted: '#545b64',
          textDark: '#16191f'
        }
      }
    },
  },
  plugins: [],
}
