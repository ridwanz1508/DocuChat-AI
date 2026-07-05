import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0F14",
          900: "#111722",
          800: "#1A2230",
          700: "#26303F",
          600: "#3A4657",
          400: "#7C8A9C",
          200: "#C7CFDA",
          100: "#E8ECF1",
        },
        signal: {
          500: "#3DD6C2",
          600: "#22B8A4",
          700: "#178F80",
        },
        amber: {
          500: "#E8A93D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
export default config;
