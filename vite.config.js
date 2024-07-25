import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname+'/pages/main/', 'index.html'),
        blur: path.resolve(__dirname+'/pages/blur/', 'index.html'),
      }
    },
  }
})