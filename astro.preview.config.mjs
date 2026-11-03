// @ts-check
// Storyblok Visual Editor preview: the normal config plus local HTTPS (the editor only loads https
// pages) and the live-preview bridge. Used by `npm run cms:preview`; production builds ignore it.
import basicSsl from '@vitejs/plugin-basic-ssl';
import base from './astro.config.mjs';
import storyblokPreview from './scripts/storyblok/preview.ts';

export default {
  ...base,
  vite: { ...base.vite, plugins: [...(base.vite?.plugins ?? []), basicSsl()] },
  integrations: [...(base.integrations ?? []), storyblokPreview()],
};
