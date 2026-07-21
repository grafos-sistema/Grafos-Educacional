import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial Grafos - Baseada no Design da Marca (PDF)
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#33A551',  // Verde principal OFICIAL da marca
          600: '#2d8f47',
          700: '#26793d',
          800: '#1f6333',
          900: '#184d29',
          950: '#0d2a16',
        },
        // Cores Neutras Modernas
        secondary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Verde Vibrante - Verde Grafos
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#33A551',  // Verde principal OFICIAL
          600: '#2d8f47',
          700: '#26793d',
          800: '#1f6333',
          900: '#184d29',
          950: '#0d2a16',
        },
        // Amarelo-Verde OFICIAL
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#C4CE45',  // Amarelo-verde OFICIAL da marca
          600: '#abb83d',
          700: '#92a235',
          800: '#798c2d',
          900: '#607625',
          950: '#3a4716',
        },
        // Vermelho Moderno
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Teal/Verde-azulado OFICIAL
        info: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#138C8C',  // Verde-azulado OFICIAL da marca
          600: '#117a7a',
          700: '#0f6868',
          800: '#0d5656',
          900: '#0b4444',
          950: '#072929',
        },
        // Azul OFICIAL (complementar)
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0C5E8E',  // Azul OFICIAL da marca
          600: '#0a527c',
          700: '#09466a',
          800: '#073a58',
          900: '#062e46',
          950: '#041d2b',
        },
        // Cores Grafos - Marca OFICIAL
        grafos: {
          green: '#33A551',       // Verde principal OFICIAL
          'green-dark': '#2d8f47',
          teal: '#138C8C',        // Verde-azulado OFICIAL
          'teal-dark': '#117a7a',
          lime: '#C4CE45',        // Amarelo-verde OFICIAL
          'lime-dark': '#abb83d',
          blue: '#0C5E8E',        // Azul OFICIAL
          'blue-dark': '#0a527c',
        },
        // Cores adicionais para gráficos (baseadas na paleta oficial)
        graph: {
          green: '#33A551',    // OFICIAL
          teal: '#138C8C',     // OFICIAL
          lime: '#C4CE45',     // OFICIAL
          blue: '#0C5E8E',     // OFICIAL
          emerald: '#10b981',
          cyan: '#06b6d4',
          indigo: '#6366f1',
          purple: '#9333ea',
          pink: '#ec4899',
          red: '#ef4444',
          orange: '#f97316',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        // TODO: Integrar Gilroy conforme Design da Marca
        // Gilroy Black para títulos, Gilroy Light para corpo
        // Por enquanto usando Inter como fallback
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'], // Para títulos (Gilroy Black no futuro)
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],    // Para corpo (Gilroy Light no futuro)
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 15px 30px -3px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#33A551',
              foreground: '#ffffff',
            },
            success: {
              DEFAULT: '#33A551',
              foreground: '#ffffff',
            },
            warning: {
              DEFAULT: '#C4CE45',
              foreground: '#18181b',
            },
            danger: {
              DEFAULT: '#ef4444',
              foreground: '#ffffff',
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: '#33A551',
              foreground: '#ffffff',
            },
            success: {
              DEFAULT: '#33A551',
              foreground: '#ffffff',
            },
            warning: {
              DEFAULT: '#C4CE45',
              foreground: '#18181b',
            },
            danger: {
              DEFAULT: '#ef4444',
              foreground: '#ffffff',
            },
          },
        },
      },
    }) as any,
  ],
};

export default config;
