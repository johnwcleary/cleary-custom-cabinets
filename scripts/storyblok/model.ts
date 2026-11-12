/**
 * Translation between src/content (what the site builds from) and Storyblok stories.
 *
 *   readLocal()    src/content files  → story drafts (push)
 *   planFiles()    stories            → which assets go where (pull, step 1)
 *   renderFiles()  stories + sizes    → src/content files, byte-for-byte in the existing format (pull, step 2)
 *
 * Image fields hold a project-relative path on the way up and a Storyblok asset on the way down.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

export const ROOT = path.resolve(import.meta.dirname, '../..');

export type Asset = { id: number | null; filename: string; alt?: string; name?: string; fieldtype?: 'asset'; [k: string]: unknown };
/** A story as both APIs return it (only the parts used here). */
export type Story = { name: string; slug: string; full_slug: string; path?: string; content: Record<string, any> };
/** What push creates; `parent` is a folder slug. */
export type StoryDraft = { name: string; slug: string; parent?: string; path: string; content: Record<string, any> };
export type OutFile = { path: string; content: string };

export const CABINETS_FOLDER = 'cabinets';

/* ─────────────────────────────── local → stories ─────────────────────────────── */

const LOCAL_IMAGE = 'local:';
const localRef = (fromFile: string, rel: string): Asset => ({ id: null, filename: LOCAL_IMAGE + path.relative(ROOT, path.resolve(path.dirname(fromFile), rel)) });
export const localPathOf = (a: Asset) => (a.filename.startsWith(LOCAL_IMAGE) ? a.filename.slice(LOCAL_IMAGE.length) : null);

async function frontmatter(file: string) {
  const raw = await readFile(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`No frontmatter in ${file}`);
  return { data: parseYaml(m[1]) as Record<string, any>, body: m[2].trim() };
}
const json = async (file: string) => JSON.parse(await readFile(file, 'utf8'));
const files = async (dir: string, ext: string) => (await readdir(dir)).filter((f) => f.endsWith(ext)).sort().map((f) => path.join(dir, f));
const blok = (component: string, data: Record<string, unknown>) => ({ component, ...data });
const lines = (xs: string[]) => xs.join('\n');

/** Home page section fields: [content key, Storyblok key]. Lists are one item per line in Storyblok. */
const HOME_SECTIONS: [string, string][] = [['aboutLabel', 'about_label'], ['aboutHeading', 'about_heading'], ['aboutText', 'about_text'], ['aboutButton', 'about_button'], ['cabinetsLabel', 'cabinets_label'], ['materialsLabel', 'materials_label'], ['cabinetryHeading', 'cabinetry_heading'], ['cabinetryMaterials', 'cabinetry_materials'], ['countertopsHeading', 'countertops_heading'], ['countertopsMaterials', 'countertops_materials'], ['showroomLabel', 'showroom_label'], ['showroomText', 'showroom_text'], ['showroomButton', 'showroom_button'], ['contactLabel', 'contact_label'], ['contactHeading', 'contact_heading'], ['contactButton', 'contact_button']];
const isList = (k: string) => k.endsWith('Materials');
const homeSectionsToStory = (data: Record<string, any>) =>
  Object.fromEntries(HOME_SECTIONS.map(([k, sb]) => [sb, isList(k) ? lines(data[k] ?? []) : (data[k] ?? '')]));

export async function readLocal(): Promise<StoryDraft[]> {
  const content = path.join(ROOT, 'src/content');
  const out: StoryDraft[] = [];

  const site = await json(path.join(content, 'site.json'));
  out.push({
    name: 'Business details (hours, phone, address)',
    slug: 'business-details',
    path: 'contact',
    content: blok('business_details', {
      announcement: site.announcement ?? '',
      business_name: site.name,
      phone: site.phone,
      email: site.email,
      street: site.address.street,
      city: site.address.city,
      state: site.address.state,
      zip: site.address.zip,
      hours: site.hours.map((h: any) => blok('hours_row', h.closed ? { days: h.days, closed: true, open: '', close: '' } : { days: h.days, closed: false, open: h.open, close: h.close })),
      service_area: site.serviceArea,
      services: lines(site.services),
      clients: lines(site.clients),
      instagram: site.social.instagram,
      facebook: site.social.facebook,
      houzz: site.social.houzz,
      tagline: site.tagline,
      meta_description: site.metaDescription,
    }),
  });

  const brands = await json(path.join(content, 'brands/brands.json'));
  out.push({
    name: 'Lines we distribute',
    slug: 'lines-we-distribute',
    path: 'about',
    content: blok('lines_page', {
      groups: Object.values(brands)
        .sort((a: any, b: any) => a.order - b.order)
        .map((g: any) => blok('brand_group', { label: g.label, brands: g.items.map((b: any) => blok('brand', { name: b.name, url: b.url ?? '' })) })),
    }),
  });

  const pageFile = (n: string) => path.join(content, 'pages', `${n}.md`);
  {
    const f = pageFile('home');
    const { data } = await frontmatter(f);
    out.push({
      name: 'Home',
      slug: 'home',
      path: '/',
      content: blok('home_page', {
        hero_title: data.heroTitle,
        hero_subtitle: data.heroSubtitle ?? '',
        hero_image: localRef(f, data.heroImage),
        hero_caption: data.heroCaption ?? '',
        hero_photos: (data.photos ?? []).map((p: any) => blok('photo', { image: localRef(f, p.image), caption: p.caption })),
        ...homeSectionsToStory(data),
        title: data.title,
        seo_title: data.seoTitle,
      }),
    });
  }
  {
    const f = pageFile('about');
    const { data, body } = await frontmatter(f);
    out.push({
      name: 'About',
      slug: 'about',
      path: 'about',
      content: blok('about_page', {
        body,
        photos: (data.photos ?? []).map((p: any) => blok('photo', { image: localRef(f, p.image), caption: p.caption })),
        title: data.title,
        seo_title: data.seoTitle,
      }),
    });
  }
  {
    const f = pageFile('contact');
    const { data } = await frontmatter(f);
    out.push({
      name: 'Contact',
      slug: 'contact',
      path: 'contact',
      content: blok('contact_page', { lead: data.lead ?? '', form_helper: data.formHelper ?? '', title: data.title, seo_title: data.seoTitle }),
    });
  }

  for (const f of await files(path.join(content, 'services'), '.md')) {
    const { data } = await frontmatter(f);
    const gdir = path.join(content, 'gallery', data.slug);
    const photos = await Promise.all((await files(gdir, '.json')).map(async (g) => ({ file: g, ...(await json(g)) })));
    photos.sort((a, b) => a.order - b.order);
    out.push({
      name: data.title,
      slug: data.slug,
      parent: CABINETS_FOLDER,
      path: `${CABINETS_FOLDER}/${data.slug}`,
      content: blok('cabinet_page', {
        title: data.title,
        short_name: data.shortName ?? '',
        intro: data.intro,
        hero_image: localRef(f, data.heroImage),
        photos: photos.map((p) => blok('gallery_photo', { image: localRef(p.file, p.image), caption: p.caption, featured: !!p.featured })),
        closing: data.closing,
        closing_aside: data.closingAside ?? '',
        brands: (data.brands ?? []).map((b: any) => blok('featured_brand', { name: b.name, url: b.url ?? '', about: b.about })),
        video_title: data.video?.title ?? '',
        video_url: data.video?.url ?? '',
        seo_title: data.seoTitle,
        legacy_path: data.legacyPath,
        order: String(data.order),
      }),
    });
  }
  return out;
}

/** Every image a set of stories references, deduplicated by local path. */
export function localImages(drafts: StoryDraft[]): string[] {
  const seen = new Set<string>();
  walkAssets(drafts.map((d) => d.content), (a) => {
    const p = localPathOf(a);
    if (p) seen.add(p);
  });
  return [...seen];
}

/** Calls `fn` for every asset object in a content tree; `fn` may return a replacement. */
export function walkAssets(node: unknown, fn: (a: Asset) => Asset | void): unknown {
  if (Array.isArray(node)) {
    node.forEach((n, i) => (node[i] = walkAssets(n, fn)));
    return node;
  }
  if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.filename === 'string' && ('fieldtype' in o || 'id' in o)) return fn(o as Asset) ?? o;
    for (const k of Object.keys(o)) o[k] = walkAssets(o[k], fn);
  }
  return node;
}

/* ─────────────────────────────── stories → files ─────────────────────────────── */

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
/** "Solid Surface" → "solidSurface", matching the existing brands.json keys. */
const camel = (s: string) => slugify(s).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const pad = (n: number) => String(n).padStart(2, '0');

function assetName(a: Asset) {
  const base = decodeURIComponent(new URL(a.filename).pathname.split('/').pop() ?? 'image');
  const ext = path.extname(base).toLowerCase() || '.jpg';
  return slugify(path.basename(base, path.extname(base))) + (ext === '.jpeg' ? '.jpg' : ext);
}
const hasImage = (a: unknown): a is Asset => !!a && typeof (a as Asset).filename === 'string' && (a as Asset).filename !== '';

type Indexed = { settings: Story; lines: Story; home: Story; about: Story; contact: Story; cabinets: Story[] };

function index(stories: Story[]): Indexed {
  const by = (c: string) => stories.filter((s) => s.content?.component === c);
  const one = (c: string) => {
    const xs = by(c);
    if (xs.length !== 1) throw new Error(`Expected exactly one "${c}" story in Storyblok, found ${xs.length}.`);
    return xs[0];
  };
  const cabinets = by('cabinet_page').sort((a, b) => Number(a.content.order || 99) - Number(b.content.order || 99) || a.name.localeCompare(b.name));
  return { settings: one('business_details'), lines: one('lines_page'), home: one('home_page'), about: one('about_page'), contact: one('contact_page'), cabinets };
}

export type Planned = { url: string; local: string };

/** Where each referenced Storyblok image will be saved (project-relative). */
export function planFiles(stories: Story[]): Planned[] {
  const s = index(stories);
  const out = new Map<string, Planned>();
  const add = (a: unknown, dir: string, prefix = '') => {
    if (hasImage(a) && [...out.values()].some((p) => p.url === a.filename && path.posix.dirname(p.local) === dir)) return;
    if (!hasImage(a)) return;
    const name = prefix + assetName(a);
    const ext = path.posix.extname(name);
    // Two different uploads with the same file name get numbered rather than overwriting each other.
    for (let n = 1; ; n++) {
      const local = path.posix.join(dir, n === 1 ? name : `${path.posix.basename(name, ext)}-${n}${ext}`);
      const prev = out.get(local);
      if (prev && prev.url !== a.filename) continue;
      out.set(local, { url: a.filename, local });
      return;
    }
  };
  add(s.home.content.hero_image, 'src/assets/home');
  for (const p of s.home.content.hero_photos ?? []) add(p.image, 'src/assets/home');
  for (const p of s.about.content.photos ?? []) add(p.image, 'src/assets/about');
  for (const c of s.cabinets) {
    const dir = `src/assets/gallery/${c.slug}`;
    add(c.content.hero_image, dir);
    for (const p of c.content.photos ?? []) add(p.image, dir);
  }
  return [...out.values()];
}

/** JSON with short objects/arrays kept on one line, as the hand-written files are. */
function prettyJson(v: unknown, indent = 0, keyLen = 0): string {
  const flat = (x: unknown): string =>
    Array.isArray(x)
      ? `[${x.map(flat).join(', ')}]`
      : x && typeof x === 'object'
        ? `{ ${Object.entries(x).map(([k, y]) => `${JSON.stringify(k)}: ${flat(y)}`).join(', ')} }`
        : JSON.stringify(x);
  if (!v || typeof v !== 'object') return JSON.stringify(v);
  const one = flat(v);
  if (indent > 0 && indent + keyLen + one.length + 1 <= 110) return one;
  const pad = ' '.repeat(indent + 2);
  if (Array.isArray(v)) return `[\n${v.map((x) => pad + prettyJson(x, indent + 2)).join(',\n')}\n${' '.repeat(indent)}]`;
  const entries = Object.entries(v).map(([k, x]) => `${pad}${JSON.stringify(k)}: ${prettyJson(x, indent + 2, JSON.stringify(k).length + 2)}`);
  return `{\n${entries.join(',\n')}\n${' '.repeat(indent)}}`;
}

/** YAML frontmatter in the existing style: strings double-quoted (JSON escapes are valid YAML). */
function fm(entries: [string, unknown, ('raw' | 'quoted')?][], body = '') {
  const out = ['---'];
  for (const [k, v, how] of entries) {
    if (v === undefined || v === '' && how !== 'quoted') continue;
    if (how === 'raw' || typeof v === 'number') out.push(`${k}: ${v}`);
    else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      if (v.length) out.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`);
    } else if (Array.isArray(v)) {
      out.push(`${k}:`);
      for (const item of v) Object.entries(item).forEach(([ik, iv], i) => out.push(`${i === 0 ? '  - ' : '    '}${ik}: ${JSON.stringify(iv)}`));
    } else if (v && typeof v === 'object') {
      out.push(`${k}:`);
      for (const [ik, iv] of Object.entries(v)) out.push(`  ${ik}: ${JSON.stringify(iv)}`);
    } else out.push(`${k}: ${JSON.stringify(v)}`);
  }
  out.push('---');
  return out.join('\n') + '\n' + (body ? `\n${body}\n` : '');
}

/** Relative path from a content file to a planned image. */
function imageRef(fromFile: string, a: unknown, plan: Map<string, string>) {
  if (!hasImage(a)) return undefined;
  const local = plan.get(a.filename);
  if (!local) throw new Error(`Image not planned: ${a.filename}`);
  return path.posix.relative(path.posix.dirname(fromFile), local);
}

const phoneHref = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return `tel:+${d.length === 10 ? '1' + d : d}`;
};
const mapsUrl = (parts: string[]) => `https://maps.google.com/?q=${parts.join(' ').trim().replace(/\s+/g, '+')}`;
const list = (v: unknown) =>
  str(v)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Renders every content file from the stories. `sizes` maps a project-relative image path to its
 * pixel size (gallery entries record it). Paths are project-relative.
 */
export function renderFiles(stories: Story[], sizes: Map<string, { width: number; height: number }>): OutFile[] {
  const s = index(stories);
  const plan = new Map(planFiles(stories).map((p) => [p.url, p.local]));
  const out: OutFile[] = [];

  const b = s.settings.content;
  const site = {
    name: str(b.business_name),
    tagline: str(b.tagline),
    email: str(b.email),
    phone: str(b.phone),
    phoneHref: phoneHref(str(b.phone)),
    address: { street: str(b.street), city: str(b.city), state: str(b.state), zip: str(b.zip) },
    mapsUrl: mapsUrl([str(b.street), str(b.city), str(b.state), str(b.zip)]),
    hours: (b.hours ?? []).map((h: any) => (h.closed ? { days: str(h.days), closed: true } : { days: str(h.days), open: str(h.open), close: str(h.close) })),
    serviceArea: str(b.service_area),
    // Only written when set, so an empty announcement leaves site.json as it was.
    ...(str(b.announcement) ? { announcement: str(b.announcement) } : {}),
    social: { instagram: str(b.instagram), facebook: str(b.facebook), houzz: str(b.houzz) },
    services: list(b.services),
    clients: list(b.clients),
    metaDescription: str(b.meta_description),
  };
  out.push({ path: 'src/content/site.json', content: prettyJson(site) + '\n' });

  const groups: Record<string, unknown> = {};
  (s.lines.content.groups ?? []).forEach((g: any, i: number) => {
    groups[camel(str(g.label)) || `group${i + 1}`] = {
      label: str(g.label),
      order: i + 1,
      items: (g.brands ?? []).map((x: any) => (str(x.url) ? { name: str(x.name), url: str(x.url) } : { name: str(x.name) })),
    };
  });
  out.push({ path: 'src/content/brands/brands.json', content: prettyJson(groups) + '\n' });

  {
    const f = 'src/content/pages/home.md';
    const c = s.home.content;
    const heroPhotos = (c.hero_photos ?? []).filter((p: any) => hasImage(p.image)).map((p: any) => ({ image: imageRef(f, p.image, plan), caption: str(p.caption) }));
    out.push({
      path: f,
      content: fm([
        ['title', str(c.title)],
        ['seoTitle', str(c.seo_title)],
        ['heroImage', imageRef(f, c.hero_image, plan)],
        ['heroCaption', str(c.hero_caption)],
        ['heroTitle', str(c.hero_title)],
        ['heroSubtitle', str(c.hero_subtitle)],
        ...HOME_SECTIONS.map(([k, sb]): [string, unknown] => [k, isList(k) ? list(c[sb]) : str(c[sb])]),
        ['photos', heroPhotos.length ? heroPhotos : undefined],
      ]),
    });
  }
  {
    const f = 'src/content/pages/about.md';
    const c = s.about.content;
    const photos = (c.photos ?? []).filter((p: any) => hasImage(p.image)).map((p: any) => ({ image: imageRef(f, p.image, plan), caption: str(p.caption) }));
    out.push({
      path: f,
      content: fm(
        [
          ['title', str(c.title)],
          ['seoTitle', str(c.seo_title)],
          ['photos', photos.length ? photos : undefined],
        ],
        str(c.body),
      ),
    });
  }
  {
    const f = 'src/content/pages/contact.md';
    const c = s.contact.content;
    out.push({
      path: f,
      content: fm([
        ['title', str(c.title)],
        ['seoTitle', str(c.seo_title)],
        ['lead', str(c.lead)],
        ['formHelper', str(c.form_helper)],
      ]),
    });
  }

  s.cabinets.forEach((story, i) => {
    const c = story.content;
    const order = Number(c.order) || i + 1;
    const f = `src/content/services/${pad(order)}-${story.slug}.md`;
    const brands = (c.brands ?? [])
      .filter((b: any) => str(b.name))
      .map((b: any) => (str(b.url) ? { name: str(b.name), url: str(b.url), about: str(b.about) } : { name: str(b.name), about: str(b.about) }));
    out.push({
      path: f,
      content: fm([
        ['slug', story.slug, 'raw'],
        ['title', str(c.title)],
        ['shortName', str(c.short_name)],
        ['order', order],
        ['intro', str(c.intro), 'quoted'],
        ['closing', str(c.closing), 'quoted'],
        ['closingAside', str(c.closing_aside)],
        ['brands', brands.length ? brands : undefined],
        ['heroImage', imageRef(f, c.hero_image, plan)],
        ['seoTitle', str(c.seo_title)],
        ['legacyPath', str(c.legacy_path) || `/cabinets-products/${story.slug}`],
        ['video', str(c.video_url) ? { title: str(c.video_title), url: str(c.video_url) } : undefined],
      ]),
    });

    const gdir = `src/content/gallery/${story.slug}`;
    (c.photos ?? [])
      .filter((p: any) => hasImage(p.image))
      .forEach((p: any, j: number) => {
        const local = plan.get(p.image.filename)!;
        const size = sizes.get(local);
        if (!size) throw new Error(`No size measured for ${local}`);
        const g = `${gdir}/${path.posix.basename(local, path.posix.extname(local))}.json`;
        const entry = {
          service: story.slug,
          order: j + 1,
          caption: str(p.caption),
          image: path.posix.relative(gdir, local),
          width: size.width,
          height: size.height,
          featured: !!p.featured,
        };
        out.push({ path: g, content: JSON.stringify(entry, null, 2) + '\n' });
      });
  });

  return out;
}

/** Content directories the pull owns completely (stale files in them are removed). */
export const OWNED_DIRS = ['src/content/services', 'src/content/gallery'];
