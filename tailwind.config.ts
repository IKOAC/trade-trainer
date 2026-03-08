import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#111827',
        bg: '#0b1220',
        accent: '#22d3ee'
      }
    }
  },
  plugins: []
};

export default config;
