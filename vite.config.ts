import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import _viteImagemin from 'vite-plugin-imagemin';
const viteImagemin = _viteImagemin.default || _viteImagemin;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    viteImagemin({
      gifsicle: {
        optimizationLevel: 6,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 6,
      },
      mozjpeg: {
        quality: 90,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 0
  },
  server: {
    port: 3000,
    open: true
  }
});
