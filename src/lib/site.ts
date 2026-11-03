import { z } from 'astro/zod';
import raw from '../content/site.json';

/** Site-wide settings (single file, so it is imported directly rather than as a collection). */
const hours = z.union([
  z.object({ days: z.string(), open: z.string(), close: z.string() }),
  z.object({ days: z.string(), closed: z.literal(true) }),
]);

const schema = z.object({
  name: z.string(),
  tagline: z.string(),
  email: z.email(),
  phone: z.string(),
  phoneHref: z.string().startsWith('tel:'),
  address: z.object({ street: z.string(), city: z.string(), state: z.string(), zip: z.string() }),
  mapsUrl: z.url(),
  hours: z.array(hours),
  serviceArea: z.string(),
  /** Optional promotion for the strip at the top of every page; empty means show serviceArea. */
  announcement: z.string().optional(),
  social: z.object({ instagram: z.url(), facebook: z.url(), houzz: z.url() }),
  services: z.array(z.string()),
  clients: z.array(z.string()),
  metaDescription: z.string(),
});

export type Site = z.infer<typeof schema>;
export type Hours = z.infer<typeof hours>;
export const site: Site = schema.parse(raw);

export const addressLine = `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`;
export const formatHours = (h: Hours) => ('closed' in h ? 'Closed' : `${h.open} – ${h.close}`);
