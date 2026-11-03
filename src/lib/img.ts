import type { ImageMetadata } from 'astro';

/** Responsive widths that never exceed the source (Astro would otherwise upscale). */
export function widthsFor(image: ImageMetadata, wanted = [480, 800, 1200, 1600, 2000]) {
  const ok = wanted.filter((w) => w < image.width);
  return [...ok, Math.min(image.width, wanted[wanted.length - 1])];
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
