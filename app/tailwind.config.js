// Paleta, tipografías y medidas del diseño táctico (Chivo + Hanken Grotesk, ámbar y verde sobre gris azulado).
// Carpeta de este archivo (con barras normales), para que Tailwind encuentre los componentes desde cualquier lado
const RAIZ = import.meta.dirname.split('\\').join('/');

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [RAIZ + '/index.html', RAIZ + '/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: { short: { raw: '(max-height: 520px)' }, tactil: { raw: '(pointer: coarse)' } },
      colors: {
        nvg: { 300: '#86efac', 400: '#4ade80', 500: '#10b981', 600: '#059669' },
        tactical: { amber: '#f59e0b', amberGlow: '#fbbf24', armor: '#38bdf8', threat: '#ef4444' },
        'surface-tint': '#ffb95f', background: '#101419', primary: '#ffc174', 'tertiary-fixed': '#acedff', 'on-background': '#e0e2ea',
        'secondary-fixed': '#6bff8f', 'on-tertiary': '#003640', tertiary: '#54ddfc', 'surface-bright': '#36393f', error: '#ffb4ab',
        'inverse-primary': '#855300', 'primary-container': '#f59e0b', 'on-secondary': '#003915', 'on-error-container': '#ffdad6',
        'on-tertiary-fixed': '#001f26', 'error-container': '#93000a', 'outline-variant': '#534434', 'on-primary-fixed-variant': '#653e00',
        'on-tertiary-container': '#004b58', surface: '#101419', 'primary-fixed-dim': '#ffb95f', 'on-primary': '#472a00',
        'on-primary-container': '#613b00', 'on-secondary-container': '#004119', 'on-secondary-fixed': '#002109', 'inverse-surface': '#e0e2ea',
        'secondary-container': '#00b954', 'secondary-fixed-dim': '#4ae176', 'surface-container-lowest': '#0a0e13',
        'on-tertiary-fixed-variant': '#004e5c', 'surface-dim': '#101419', 'on-surface-variant': '#d8c3ad', 'surface-variant': '#31353b',
        'inverse-on-surface': '#2d3136', 'surface-container-low': '#181c21', 'on-surface': '#e0e2ea', 'primary-fixed': '#ffddb8',
        'tertiary-container': '#29c1df', 'on-secondary-fixed-variant': '#005321', 'on-error': '#690005', secondary: '#4ae176',
        'on-primary-fixed': '#2a1700', outline: '#a08e7a', 'surface-container': '#1c2025', 'tertiary-fixed-dim': '#4cd7f6',
        'surface-container-highest': '#31353b', 'surface-container-high': '#262a30',
      },
      borderRadius: { DEFAULT: '0.125rem', lg: '0.25rem', xl: '0.5rem', full: '0.75rem' },
      spacing: {
        'gutter-desktop': '1.5rem', 'space-xs': '0.25rem', 'space-md': '1rem', margin: '1rem', gutter: '1rem', 'space-sm': '0.5rem',
        'space-xl': '2rem', 'margin-desktop': '2.5rem', 'space-lg': '1.5rem',
      },
      fontFamily: {
        tactical: ['Rajdhani', 'sans-serif'], mono: ['Chivo Mono', 'monospace'],
        'body-md': ['Hanken Grotesk', 'sans-serif'], 'headline-xl-mobile': ['Chivo', 'sans-serif'], 'body-sm': ['Hanken Grotesk', 'sans-serif'],
        'label-lg': ['Chivo', 'sans-serif'], 'headline-xl': ['Chivo', 'sans-serif'], 'headline-lg': ['Chivo', 'sans-serif'],
        'label-sm': ['Chivo', 'sans-serif'], 'headline-md': ['Chivo', 'sans-serif'], 'label-md': ['Chivo', 'sans-serif'],
        'body-lg': ['Hanken Grotesk', 'sans-serif'], 'headline-lg-mobile': ['Chivo', 'sans-serif'],
      },
      fontSize: {
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '400' }],
        'headline-xl-mobile': ['32px', { lineHeight: '36px', letterSpacing: '0.04em', fontWeight: '900' }],
        'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '400' }],
        'label-lg': ['13px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '700' }],
        'headline-xl': ['48px', { lineHeight: '52px', letterSpacing: '0.05em', fontWeight: '900' }],
        'headline-lg': ['32px', { lineHeight: '38px', letterSpacing: '0.04em', fontWeight: '800' }],
        'label-sm': ['9px', { lineHeight: '12px', letterSpacing: '0.12em', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '26px', letterSpacing: '0.03em', fontWeight: '700' }],
        'label-md': ['11px', { lineHeight: '14px', letterSpacing: '0.1em', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0.01em', fontWeight: '500' }],
        'headline-lg-mobile': ['24px', { lineHeight: '30px', letterSpacing: '0.03em', fontWeight: '800' }],
      },
    },
  },
  plugins: [],
};
