/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors (standards-grade design)
        bg: {
          base: '#0A0A0B',
          subtle: '#141416',
          raised: '#1C1C1F',
          input: '#0F0F10',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1A6',
          tertiary: '#6E6E73',
          disabled: '#48484D',
        },
        accent: {
          DEFAULT: '#0A84FF',
          hover: '#409CFF',
          muted: '#0A3D75',
        },
        border: {
          subtle: '#2C2C2E',
          strong: '#48484D',
          accent: '#0A84FF',
        },
        functional: {
          success: '#30D158',
          error: '#FF453A',
          warning: '#FFD60A',
        }
      },
      spacing: {
        '4xs': '2px',
        '3xs': '4px',
        '2xs': '8px',
        'xs': '12px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
        '3xl': '96px',
        '4xl': '128px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'h1-mobile': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1-desktop': ['48px', { lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2-mobile': ['28px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h2-desktop': ['36px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3-mobile': ['20px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '600' }],
        'h3-desktop': ['24px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '600' }],
        'h4-mobile': ['16px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '600' }],
        'h4-desktop': ['18px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '600' }],
        'body-lg-mobile': ['18px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '400' }],
        'body-lg-desktop': ['20px', { lineHeight: '32px', letterSpacing: '0', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', letterSpacing: '0', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '16px', letterSpacing: '0.03em', fontWeight: '500' }],
        'code-inline': ['14px', { fontWeight: '400' }],
        'code-block': ['13px', { lineHeight: '20px', fontWeight: '400' }],
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
      maxWidth: {
        'content-mobile': '358px',
        'content-tablet': '704px',
        'content-desktop': '928px',
        'content-wide': '1312px',
        'prose': '80ch',
        'heading': '40ch',
      },
    },
  },
  plugins: [],
};
