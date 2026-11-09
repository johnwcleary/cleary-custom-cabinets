import type { ImageMetadata } from 'astro';

/**
 * Swatches for the home page's materials, matched to Storyblok's material names by file name. All are
 * cropped from the client's own gallery, except granite.jpg (Poly Haven "Granite Tile 03", CC0).
 */
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/materials/*.jpg', { eager: true });

export function swatch(name: string, group: 'cabinet' | 'counter'): ImageMetadata | undefined {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return files[`../assets/materials/${group === 'cabinet' ? 'cabinet-' : ''}${slug}.jpg`]?.default;
}
