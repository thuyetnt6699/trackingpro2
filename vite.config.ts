import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dùng './' để đường dẫn tài nguyên thành tương đối (relative)
  // Giúp chạy được trên cả Vercel (root domain) và GitHub Pages (sub-folder)
  base: './', 
  build: {
    outDir: 'dist',
  }
});