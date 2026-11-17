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
  // The contact form's thank-you page is not one to list.
  integrations: [sitemap({ filter: (page) => !page.includes('/thanks') })],
});
