import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content model. Everything editable lives in src/content/ as plain Markdown frontmatter or JSON.
 * Storyblok is the editing tool: `npm run cms:pull` writes these files from it (docs/storyblok.md).
 * Image fields are paths relative to the content file, resolved by Astro's image() helper.
 */

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string(),
      title: z.string(),
      /** One or two words for tiles and menus ("Kitchens"); falls back to the title. */
      shortName: z.string().optional(),
      order: z.number().int(),
      /** The page's lead sentence. Empty when the live page has no copy (quick-ship). */
      intro: z.string(),
      /** The sentence under the gallery. */
      closing: z.string(),
      /** Optional second closing line (wall units: "Bring us your design idea…"). */
      closingAside: z.string().optional(),
      /** Brands sold for this product, each with a short description in our own words. */
      brands: z.array(z.object({ name: z.string(), url: z.url().optional(), about: z.string() })).optional(),
      heroImage: image(),
      /** The live page <title>, kept because it is specific and useful for search. */
      seoTitle: z.string(),
      /** Path on the old Squarespace site, for redirects. */
      legacyPath: z.string(),
      video: z.object({ title: z.string(), url: z.url() }).optional(),
    }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/gallery' }),
  schema: ({ image }) =>
    z.object({
      service: z.string(),
      order: z.number().int(),
      /** Doubles as alt text. */
      caption: z.string().min(1),
      image: image(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      /** Shown large on the service page; the rest go in the quieter index. */
      featured: z.boolean().default(false),
    }),
});

const brand = z.object({ name: z.string(), url: z.url().optional() });
const brands = defineCollection({
  loader: file('./src/content/brands/brands.json'),
  schema: z.object({
    label: z.string(),
    order: z.number().int(),
    items: z.array(brand),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      seoTitle: z.string(),
      lead: z.string().optional(),
      heroImage: image().optional(),
      heroCaption: z.string().optional(),
      heroTitle: z.string().optional(),
      heroSubtitle: z.string().optional(),
      // Home page sections (optional, so other pages can ignore them).
      aboutLabel: z.string().optional(),
      aboutHeading: z.string().optional(),
      aboutText: z.string().optional(),
      aboutButton: z.string().optional(),
      cabinetsLabel: z.string().optional(),
      materialsLabel: z.string().optional(),
      cabinetryHeading: z.string().optional(),
      cabinetryMaterials: z.array(z.string()).optional(),
      countertopsHeading: z.string().optional(),
      countertopsMaterials: z.array(z.string()).optional(),
      showroomLabel: z.string().optional(),
      showroomText: z.string().optional(),
      showroomButton: z.string().optional(),
      contactLabel: z.string().optional(),
      contactHeading: z.string().optional(),
      contactButton: z.string().optional(),
      formHelper: z.string().optional(),
      photos: z.array(z.object({ image: image(), caption: z.string().min(1) })).optional(),
    }),
});

export const collections = { services, gallery, brands, pages };
