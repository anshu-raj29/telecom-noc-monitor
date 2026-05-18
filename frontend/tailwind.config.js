export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      },
      colors: {
        ran: {
          ink: "#060914",
          panel: "rgba(12, 18, 37, 0.72)",
          line: "rgba(101, 137, 255, 0.24)",
          cyan: "#22d3ee",
          blue: "#4f7cff",
          violet: "#8b5cf6",
          green: "#2dd4bf",
          amber: "#fbbf24",
          red: "#fb7185"
        }
      },
      boxShadow: {
        glow: "0 0 28px rgba(34, 211, 238, 0.22)",
        violet: "0 0 32px rgba(139, 92, 246, 0.18)"
      }
    }
  },
  plugins: []
};

