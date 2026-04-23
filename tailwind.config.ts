import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sakura: {
          50: "#fff0f5",
          100: "#ffe0eb",
          200: "#ffc2d6",
          300: "#ff94b8",
          400: "#ff5c93",
          500: "#ff2d6e",
          600: "#e8004d",
          700: "#c4003e",
          800: "#a30035",
          900: "#87002e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
