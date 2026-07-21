import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'grafos-green': '#10B981',
        'grafos-green-dark': '#059669',
        'grafos-teal': '#14B8A6',
        'grafos-teal-dark': '#0D9488',
        'grafos-lime': '#84CC16',
        'grafos-lime-dark': '#65A30D',
        'grafos-blue': '#3B82F6',
        'grafos-blue-dark': '#2563EB',
      },
    },
  },
  plugins: [],
};

export default config;
