import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // En dev, /api est redirigé vers le serveur Express : une seule origine, donc ça marche
  // aussi depuis un vrai téléphone (http://IP-du-PC:5173) sans toucher au CORS.
  const target = env.VITE_PROXY_TARGET || 'http://localhost:5000';
  return {
    plugins: [react()],
    server: { host: true, port: 5173, proxy: { '/api': { target, changeOrigin: true } } },
  };
});
