import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

const DEFAULT_BACKEND_TARGET = "http://localhost:3000";

function resolveBackendTarget(raw?: string) {
  if (!raw) return DEFAULT_BACKEND_TARGET;
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_BACKEND_TARGET;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = resolveBackendTarget(env.VITE_API_URL);

  const createProxy = (options?: Record<string, unknown>) => ({
    target: backendTarget,
    changeOrigin: true,
    ...options,
  });

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/graphql": createProxy(),
        "/v1/ai-chat": createProxy(),
        "/v1/admin/uploads": createProxy(),
        "/chat": createProxy({ ws: true }),
        "/socket.io": createProxy({ ws: true }),
        "/ai-chat": createProxy(),
        "/admin/uploads": createProxy(),
      },
    },
  };
});
