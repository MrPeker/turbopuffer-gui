import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['util', 'buffer', 'process', 'stream', 'zlib', 'crypto', 'http', 'https', 'net', 'url', 'querystring', 'events', 'assert'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['@turbopuffer/turbopuffer'],
    exclude: ['undici']
  },
  build: {
    rollupOptions: {
      external: ['undici']
    }
  }
});
