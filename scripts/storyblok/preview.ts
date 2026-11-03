/**
 * Live preview for Storyblok's Visual Editor, used only by `npm run cms:preview`.
 *
 * Inside the editor, the page loads Storyblok's bridge script. Each edit (after a short pause while
 * typing) or save is sent to this dev server, which writes it into src/content with the same code as
 * `cms:pull`; the page then reloads with the change. The pages need no Storyblok-specific code.
 */
import type { AstroIntegration } from 'astro';
import { ROOT, type Story } from './model.ts';
import { writeStories } from './write.ts';

const ENDPOINT = '/__storyblok/story';

const BRIDGE = `
if (new URLSearchParams(location.search).has('_storyblok')) {
  const s = document.createElement('script');
  s.src = 'https://app.storyblok.com/f/storyblok-v2-latest.js';
  s.onload = () => {
    const bridge = new window.StoryblokBridge();
    let timer;
    const send = async (story) => {
      const res = await fetch(${JSON.stringify(ENDPOINT)}, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ story }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) console.error('[storyblok preview]', out.error ?? res.status);
      else if (out.changed) location.reload();
    };
    bridge.on('input', ({ story }) => { clearTimeout(timer); timer = setTimeout(() => send(story), 700); });
    bridge.on(['change', 'published'], () => send(null));
  };
  document.head.append(s);
}`;

export default function storyblokPreview(): AstroIntegration {
  return {
    name: 'ccc-storyblok-preview',
    hooks: {
      'astro:config:setup': ({ command, injectScript }) => {
        if (command === 'dev') injectScript('page', BRIDGE);
      },
      'astro:server:setup': ({ server, logger, refreshContent }) => {
        // Edits arrive faster than a write finishes; run one at a time and keep only the latest.
        let running: Promise<unknown> = Promise.resolve();
        server.middlewares.use(ENDPOINT, (req, res) => {
          if (req.method !== 'POST') return void ((res.statusCode = 405), res.end());
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            running = running.then(async () => {
              try {
                const { story } = JSON.parse(body || '{}') as { story: Story & { id?: number } | null };
                const { delivery } = await import('./client.ts');
                // The editor sends only the story being edited; the rest come from Storyblok (drafts).
                const all = (await delivery().getAll('cdn/stories', { version: 'draft' })) as (Story & { id?: number })[];
                const merged = story ? all.map((s) => (s.id === story.id ? story : s)) : all;
                const { changed, written, removed } = await writeStories(merged, { root: ROOT, log: (m) => logger.info(m) });
                // Tell the dev server directly rather than waiting for its file watcher (which can merge
                // quick successive writes), and only answer once the content collections have reloaded,
                // so the editor's reload shows the new content rather than the previous edit.
                for (const f of written) server.watcher.emit('change', f);
                for (const f of removed) server.watcher.emit('unlink', f);
                if (changed) await refreshContent?.({});
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ changed }));
              } catch (e) {
                logger.error(String(e));
                res.statusCode = 500;
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ error: String((e as Error).message ?? e) }));
              }
            });
          });
        });
      },
    },
  };
}
