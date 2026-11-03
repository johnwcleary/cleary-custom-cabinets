/**
 * Offline check of the Storyblok mapping: src/content → stories → files in a temp folder, then
 * compares with the real src/content. No network, no account.
 *
 *   npm run cms:check
 */
import { execFileSync } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ROOT, localPathOf, readLocal, walkAssets, type Story } from './storyblok/model.ts';
import { writeStories } from './storyblok/write.ts';

const drafts = await readLocal();
const fake = new Map<string, string>();
let id = 1;
const stories: Story[] = drafts.map((d) => ({
  name: d.name,
  slug: d.slug,
  full_slug: d.parent ? `${d.parent}/${d.slug}` : d.slug,
  content: walkAssets(structuredClone(d.content), (a) => {
    // One asset per file, as the real push uploads each file once.
    const local = localPathOf(a)!;
    let url = [...fake].find(([, l]) => l === local)?.[0];
    if (!url) {
      url = `https://a.storyblok.com/f/0/0x0/${(id++).toString(16)}/${path.basename(local)}`;
      fake.set(url, local);
    }
    return { id, filename: url, fieldtype: 'asset' };
  }) as Record<string, any>,
}));

const tmp = await mkdtemp(path.join(os.tmpdir(), 'ccc-storyblok-'));
await writeStories(stories, { root: tmp, fetchAsset: (url) => readFile(path.join(ROOT, fake.get(url)!)) });

let diff = '';
try {
  execFileSync('diff', ['-r', path.join(ROOT, 'src/content'), path.join(tmp, 'src/content')], { encoding: 'utf8' });
} catch (e: any) {
  diff = e.stdout;
}
for (const local of new Set(fake.values())) {
  try {
    execFileSync('cmp', ['-s', path.join(ROOT, local), path.join(tmp, local)]);
  } catch {
    diff += `image differs: ${local}\n`;
  }
}
await rm(tmp, { recursive: true, force: true });

if (diff) {
  console.log(diff);
  console.log('✗ Round trip changed the content (above).');
  process.exit(1);
}
console.log(`✓ Round trip reproduces src/content exactly (${stories.length} stories, ${fake.size} photos).`);
