import { site } from './site';
import { pad2 } from './img';

/** Structured data (schema.org JSON-LD) that tells search engines who and where the business is. */

const DAYS: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

/** "8:00 AM" → "08:00". */
function to24(time: string) {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return undefined;
  const hour = (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${pad2(hour)}:${m[2]}`;
}

/** The showroom hours as written in site.json ("Mon, Tue, Wed, Fri"). Anything it cannot read is left out. */
function openingHours() {
  return site.hours.flatMap((h) => {
    if ('closed' in h) return [];
    const dayOfWeek = h.days.split(',').flatMap((d) => DAYS[d.trim().slice(0, 3).toLowerCase()] ?? []);
    const opens = to24(h.open);
    const closes = to24(h.close);
    if (!dayOfWeek.length || !opens || !closes) return [];
    return [{ '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes }];
  });
}

export const businessId = (origin: URL) => new URL('/#business', origin).href;

/** The business itself, printed on every page. */
export function businessSchema(origin: URL, image: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': businessId(origin),
    name: site.name,
    url: origin.href,
    image,
    telephone: site.phoneHref.replace(/^tel:/, ''),
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: 'US',
    },
    hasMap: site.mapsUrl,
    areaServed: site.serviceArea,
    openingHoursSpecification: openingHours(),
    sameAs: Object.values(site.social),
  };
}

/** One blog post, published by the business. */
export function postSchema(origin: URL, post: { url: string; title: string; description: string; date: Date; updated?: Date; image: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.date.toISOString(),
    dateModified: (post.updated ?? post.date).toISOString(),
    mainEntityOfPage: post.url,
    author: { '@id': businessId(origin) },
    publisher: { '@id': businessId(origin) },
  };
}

/** JSON for a <script type="application/ld+json">, safe to print inside HTML. */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
