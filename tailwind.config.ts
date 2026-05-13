import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        budget: {
          positive: '#1D9E75',
          zero: '#BA7517',
          negative: '#E24B4A',
        },
        delta: {
          posText: '#0F6E56',
          posBg: '#E1F5EE',
          negText: '#A32D2D',
          negBg: '#FCEBEB',
          neutText: '#5F5E5A',
          neutBg: '#F1EFE8',
        },
      },
    },
  },
  plugins: [],
}

export default config
