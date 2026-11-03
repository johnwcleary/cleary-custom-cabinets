/**
 * Fetches the content from Storyblok and writes it into src/content and src/assets, in exactly the
 * format the site already reads. Run before a build; the pages need no changes.
 *
 *   npm run cms:pull            published content (what the live site should show)
 *   npm run cms:pull -- --draft saved-but-unpublished changes too (needs the Preview token)
 */
import { ROOT, type Story } from './storyblok/model.ts';
import { delivery } from './storyblok/client.ts';
import { writeStories } from './storyblok/write.ts';

const version = process.argv.includes('--draft') ? 'draft' : 'published';
const stories = (await delivery().getAll('cdn/stories', { version })) as Story[];
console.log(`Fetched ${stories.length} ${version} stories from Storyblok.`);
await writeStories(stories, { root: ROOT, log: console.log });
