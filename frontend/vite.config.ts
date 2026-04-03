import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/graphql": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/v1/ai-chat": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/v1/admin/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/chat": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
      "/ai-chat": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/admin/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
