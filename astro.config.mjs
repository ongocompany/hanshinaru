import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hanshinaru.kr',
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
