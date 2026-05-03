import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
    lightningcss: {
      targets: browserslistToTargets(browserslist('defaults, Chrome >= 64, iOS >= 12, Safari >= 12, Android >= 4.4')),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: 'lightningcss',
    target: ['es2015', 'chrome69', 'ios12'],
  },
});