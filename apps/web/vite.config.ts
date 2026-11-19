import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, '../..'), '');
  return { plugins: [react()], server: { proxy: { '/api': `http://127.0.0.1:${env.PORT || 3001}` } } };
});
