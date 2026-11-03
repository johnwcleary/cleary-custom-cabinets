/**
 * Writes Storyblok stories into src/content (and their photos into src/assets) under `root`.
 * Shared by `npm run cms:pull` and the live preview server.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { OWNED_DIRS, planFiles, renderFiles, type Story } from './model.ts';

/** Remembers which Storyblok URL each saved photo came from, so unchanged photos are not re-downloaded. */
const MANIFEST = '.storyblok/assets.json';

export type WriteOptions = {
  root: string;
  /** Fetches one image. Defaults to an HTTP download. */
  fetchAsset?: (url: string) => Promise<Buffer>;
  log?: (msg: string) => void;
};

const download = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
};

async function readManifest(root: string): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(path.join(root, MANIFEST), 'utf8'));
  } catch {
    return {};
  }
}

/** Pixel size as displayed (EXIF rotation applied). */
async function measure(file: string) {
  const m = await sharp(file).metadata();
  const rotated = (m.orientation ?? 1) >= 5;
  return { width: (rotated ? m.height : m.width)!, height: (rotated ? m.width : m.height)! };
}

async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p)));
    else out.push(p);
  }
  return out;
}

export async function writeStories(stories: Story[], { root, fetchAsset = download, log = () => {} }: WriteOptions) {
  const plan = planFiles(stories);
  const manifest = await readManifest(root);
  let fetched = 0;
  for (const p of plan) {
    const abs = path.join(root, p.local);
    if (manifest[p.local] === p.url && existsSync(abs)) continue;
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, await fetchAsset(p.url));
    manifest[p.local] = p.url;
    fetched++;
  }
  if (fetched) log(`Downloaded ${fetched} photo${fetched === 1 ? '' : 's'}.`);

  const sizes = new Map<string, { width: number; height: number }>();
  for (const p of plan) sizes.set(p.local, await measure(path.join(root, p.local)));

  const files = renderFiles(stories, sizes);
  const keep = new Set(files.map((f) => path.join(root, f.path)));
  const removed: string[] = [];
  const written: string[] = [];
  for (const dir of OWNED_DIRS) {
    for (const f of await listFiles(path.join(root, dir))) {
      if (!keep.has(f)) {
        await rm(f);
        removed.push(f);
      }
    }
  }
  for (const f of files) {
    const abs = path.join(root, f.path);
    const prev = existsSync(abs) ? await readFile(abs, 'utf8') : null;
    if (prev === f.content) continue;
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, f.content);
    written.push(abs);
  }
  const changed = removed.length + written.length;
  await mkdir(path.join(root, path.dirname(MANIFEST)), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(path.join(root, MANIFEST), JSON.stringify(sorted, null, 2) + '\n');
  log(changed ? `Updated ${changed} content file${changed === 1 ? '' : 's'}.` : 'Content already up to date.');

  // Photos no longer used are left in place (pages may import some directly); list them for tidying.
  const used = new Set(plan.map((p) => path.join(root, p.local)));
  const orphans = (await listFiles(path.join(root, 'src/assets/gallery'))).filter((f) => !used.has(f));
  if (orphans.length) log(`${orphans.length} photo(s) in src/assets/gallery are no longer used by any page.`);
  return { fetched, changed, written, removed };
}
