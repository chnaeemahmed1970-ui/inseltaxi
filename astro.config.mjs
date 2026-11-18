// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://inseltaxi-ratzeburg.de',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Kleines CSS direkt ins HTML: kein render-blockierender Request (kritisches CSS)
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  devToolbar: { enabled: false },
});
