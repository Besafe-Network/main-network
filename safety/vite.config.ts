import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const resolveNodeModule = (pkg: string) => {
  const localPath = path.resolve(__dirname, 'node_modules', pkg);
  return fs.existsSync(localPath) ? localPath : path.resolve(__dirname, '../node_modules', pkg);
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
        react: resolveNodeModule('react'),
        'react-dom': resolveNodeModule('react-dom'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    server: {
      // Expose to local network / all addresses
      host: true,
      // Allow requests from all incoming host headers (Vite 6+)
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});