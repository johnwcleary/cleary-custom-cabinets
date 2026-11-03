/**
 * One-time migration: creates the editing screens (components) in a Storyblok space, uploads every
 * photo, and creates one story per page from the current src/content. Publishes everything.
 *
 *   npm run cms:push -- --dry-run     show what would be created (no network, no tokens)
 *   npm run cms:push                  do it
 *   npm run cms:push -- --overwrite   also replace stories that already exist (discards edits made in Storyblok)
 *
 * Safe to re-run: components are updated in place, photos already uploaded are skipped, and existing
 * stories are left alone unless --overwrite is passed.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { COMPONENTS, STARTER_COMPONENTS } from './storyblok/schema.ts';
import { CABINETS_FOLDER, ROOT, localImages, localPathOf, readLocal, walkAssets, type Asset } from './storyblok/model.ts';

const dryRun = process.argv.includes('--dry-run');
const overwrite = process.argv.includes('--overwrite');
const drafts = await readLocal();
const images = localImages(drafts);

if (dryRun) {
  console.log(`Would create or update ${COMPONENTS.length} components: ${COMPONENTS.map((c) => c.display_name).join(', ')}.`);
  console.log(`Would upload ${images.length} photos.`);
  console.log(`Would create a "${CABINETS_FOLDER}" folder and ${drafts.length} stories:`);
  for (const d of drafts) console.log(`  ${d.parent ? d.parent + '/' : ''}${d.slug}  (${d.content.component}) — preview at /${d.path.replace(/^\//, '')}`);
  process.exit(0);
}

const { management } = await import('./storyblok/client.ts');
const { client, spaceId } = management();
const sp = (p: string) => `spaces/${spaceId}/${p}`;

/* 1. Components */
const existing = (await client.getAll(sp('components'), {}, 'components')) as { id: number; name: string }[];
for (const c of COMPONENTS) {
  const found = existing.find((e) => e.name === c.name);
  if (found) await client.put(sp(`components/${found.id}`), { component: c } as any);
  else await client.post(sp('components'), { component: c } as any);
}
console.log(`✓ ${COMPONENTS.length} components ready.`);

/* 2. Photos (remembered in .storyblok/uploaded.json so a re-run does not upload duplicates) */
const UPLOADED = path.join(ROOT, '.storyblok/uploaded.json');
const uploaded: Record<string, Asset> = existsSync(UPLOADED) ? JSON.parse(await readFile(UPLOADED, 'utf8')) : {};
const key = (local: string) => `${spaceId}:${local}`;
let done = 0;
for (const local of images) {
  if (uploaded[key(local)]) continue;
  const abs = path.join(ROOT, local);
  const { width, height } = await sharp(abs).metadata();
  const filename = path.basename(local);
  const signed = (await client.post(sp('assets/'), { filename, size: `${width}x${height}`, validate_upload: 1 } as any)).data as any;
  const form = new FormData();
  for (const [k, v] of Object.entries(signed.fields)) form.append(k, String(v));
  form.append('file', new Blob([await readFile(abs)], { type: 'image/jpeg' }), filename);
  const res = await fetch(signed.post_url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload of ${local} failed: ${res.status} ${await res.text()}`);
  await client.get(sp(`assets/${signed.id}/finish_upload`));
  const url = String(signed.pretty_url).startsWith('//') ? `https:${signed.pretty_url}` : String(signed.pretty_url);
  uploaded[key(local)] = { id: signed.id, filename: url, fieldtype: 'asset', alt: '', name: '', title: '', focus: '', copyright: '' };
  await mkdir(path.dirname(UPLOADED), { recursive: true });
  await writeFile(UPLOADED, JSON.stringify(uploaded, null, 2) + '\n');
  if (++done % 10 === 0) console.log(`  uploaded ${done} photos…`);
}
console.log(`✓ ${images.length} photos in Storyblok (${done} uploaded now).`);

/* 3. Stories */
type Listed = { id: number; full_slug: string; content_type: string; is_folder: boolean };
const listStories = async () => (await client.getAll(sp('stories'), {}, 'stories')) as Listed[];
let stories = await listStories();
let folder = stories.find((s) => s.is_folder && s.full_slug === CABINETS_FOLDER);
if (!folder) {
  folder = (await client.post(sp('stories'), { story: { name: 'Cabinet pages', slug: CABINETS_FOLDER, is_folder: true, default_root: 'cabinet_page' } } as any)).data.story as Listed;
}
let created = 0,
  updated = 0,
  skipped = 0;
for (const d of drafts) {
  const content = walkAssets(structuredClone(d.content), (a) => uploaded[key(localPathOf(a)!)]);
  const fullSlug = d.parent ? `${d.parent}/${d.slug}` : d.slug;
  const story = { name: d.name, slug: d.slug, path: d.path, parent_id: d.parent ? folder.id : 0, content };
  const found = stories.find((s) => !s.is_folder && s.full_slug === fullSlug);
  // A new space's demo "Home" story is replaced; anything else that exists is kept unless --overwrite.
  const starter = found && STARTER_COMPONENTS.includes(found.content_type);
  if (found && !overwrite && !starter) {
    skipped++;
    continue;
  }
  if (found) {
    await client.put(sp(`stories/${found.id}`), { story, publish: 1, force_update: 1 } as any);
    updated++;
  } else {
    await client.post(sp('stories'), { story, publish: 1 } as any);
    created++;
  }
}
console.log(`✓ Stories: ${created} created, ${updated} replaced, ${skipped} already there (left alone).`);

/* 4. Space settings: Visual Editor preview address, and a real default page type instead of the demo one. */
const space = (await client.get(`spaces/${spaceId}`)).data.space as { domain?: string; default_root?: string };
const settings: Record<string, string> = {};
if (!space.domain || /storyblok\.com/.test(space.domain)) settings.domain = 'https://localhost:4322/';
if (!space.default_root || STARTER_COMPONENTS.includes(space.default_root)) settings.default_root = 'cabinet_page';
if (Object.keys(settings).length) {
  await client.put(`spaces/${spaceId}`, { space: settings } as any);
  if (settings.domain) console.log(`✓ Visual Editor preview set to ${settings.domain}`);
}

/* 5. Remove the demo components a new space ships with, once nothing uses them. */
stories = await listStories();
const current = (await client.getAll(sp('components'), {}, 'components')) as { id: number; name: string }[];
for (const name of STARTER_COMPONENTS) {
  const c = current.find((e) => e.name === name);
  if (!c || stories.some((s) => s.content_type === name)) continue;
  try {
    await client.delete(sp(`components/${c.id}`), {});
  } catch (e: any) {
    console.warn(`  (could not remove demo component "${name}": ${e?.message ?? e})`);
  }
}
console.log('Done. Next: npm run cms:pull, then npm run build.');
