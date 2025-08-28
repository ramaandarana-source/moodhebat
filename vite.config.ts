import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Vite secara otomatis memuat variabel dari file .env yang diawali dengan VITE_
    // Tidak perlu lagi memuat atau mendefinisikannya secara manual.
    return {
      // Path dasar harus sesuai dengan nama repositori GitHub Anda.
      // Jika repo Anda adalah https://github.com/username/ryad-tools, maka base harus '/ryad-tools/'.
      base: '/moodhebat/',
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});