import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Service = CollectionEntry<'services'>;
export type GalleryItem = CollectionEntry<'gallery'>;
export type BrandGroup = CollectionEntry<'brands'>;

export const serviceHref = (slug: string) => `/cabinets/${slug}`;

export async function getServices(): Promise<Service[]> {
  return (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
}

export async function getGallery(service: string): Promise<GalleryItem[]> {
  return (await getCollection('gallery', (g) => g.data.service === service)).sort((a, b) => a.data.order - b.data.order);
}

export async function getBrandGroups(): Promise<BrandGroup[]> {
  return (await getCollection('brands')).sort((a, b) => a.data.order - b.data.order);
}

export async function getPage(id: 'home' | 'about' | 'contact') {
  const page = await getEntry('pages', id);
  if (!page) throw new Error(`Missing src/content/pages/${id}.md`);
  return page;
}

/** Previous/next service, wrapping around. */
export function neighbours(services: Service[], slug: string) {
  const i = services.findIndex((s) => s.data.slug === slug);
  const n = services.length;
  return { prev: services[(i - 1 + n) % n], next: services[(i + 1) % n] };
}

/** Split a gallery into the featured images (shown large) and the remaining index. */
export function splitFeatured(items: GalleryItem[], heroSrc?: string) {
  const featured = items.filter((g) => g.data.featured);
  // Put the service's hero image first among the featured set.
  if (heroSrc) featured.sort((a, b) => Number(b.data.image.src === heroSrc) - Number(a.data.image.src === heroSrc));
  return { featured, rest: items.filter((g) => !g.data.featured) };
}

/** Caption of the gallery photo used as a service's hero (alt text for index thumbnails). */
export function heroCaption(service: Service, items: GalleryItem[]) {
  return items.find((g) => g.data.image.src === service.data.heroImage.src)?.data.caption ?? service.data.title;
}

export async function getAllGallery(): Promise<GalleryItem[]> {
  return getCollection('gallery');
}
