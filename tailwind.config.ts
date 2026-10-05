import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14221e",
        muted: "#738079",
        paper: "#f5f7f4",
        forest: "#173e32",
        mint: "#e4f2eb",
        line: "#e6ebe7",
      },
      boxShadow: { card: "0 8px 28px rgba(25, 48, 38, .045)" },
    },
  },
  plugins: [],
};

export default config;
