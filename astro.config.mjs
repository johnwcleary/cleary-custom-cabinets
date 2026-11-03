// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // The production domain (used for canonical URLs and the sitemap).
  site: 'https://www.clearycustomcabinets.com',
  output: 'static',
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
