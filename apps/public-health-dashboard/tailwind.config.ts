import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7FF',
          100: '#BAE7FF',
          200: '#91D5FF',
          300: '#69C0FF',
          400: '#40A9FF',
          500: '#1890FF',
          600: '#096DD9',
          700: '#0050B3',
          800: '#003A8C',
          900: '#002766',
        },
        success: '#52C41A',
        warning: '#FAAD14',
        error: '#FF4D4F',
        info: '#1890FF',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-success': 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
        'gradient-info': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
