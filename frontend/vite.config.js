import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/socket.io": { target: "http://localhost:5000", ws: true },
    },
  },

   build: {
    chunkSizeWarningLimit: 600, // Increase warning threshold since chunks are now split
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React stays in one chunk
          "react-vendor":    ["react", "react-dom", "react-router-dom"],
          // Redux ecosystem
          "redux-vendor":    ["@reduxjs/toolkit", "react-redux"],
          // Heavy animation library
          "framer":          ["framer-motion"],
          // Forms
          "forms":           ["react-hook-form", "@hookform/resolvers", "zod"],
          // Date utilities
          "date-utils":      ["date-fns"],
          // Socket
          "socket":          ["socket.io-client"],
          // Firebase (only loaded when user opens phone verification)
          "firebase":        ["firebase/app", "firebase/auth"],
        },
      },
    },
  },
});
